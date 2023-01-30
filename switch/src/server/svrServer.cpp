#include <netinet/in.h>
#include <mem.h>
#include <nn/os.h>
#include <nn/nifm.h>
#include <nn/socket.h>
#include <prim/seadScopedLock.h>
#include <util/utilMacros.hpp>

#include "svrPacket.hpp"
#include "svrSession.hpp"
#include "svrSessionMgr.hpp"
#include "svrServer.hpp"

#define SOCKET_POOL_SIZE 0x100000
#define SOCKET_POOL_ALLOC_SIZE 0x20000

namespace uks::svr {

static u64 sStatus = 0;
u32 GetSvrStatus() {
    return sStatus;
}

static nn::os::ThreadType sServerThread;

void ServerThread(void* _args) {
    Server server(PORT);
    
    if(!server.Init()){
        return;
    }

    while(server.HandleClient()){
        server.ReleaseClient();
    }

    server.ReleaseClient();
    server.Uninit();
}

void RunServer() {
    sStatus = 0;
    const size_t stackSize = 0x80000;
    void* threadStack = memalign(0x1000, stackSize);

    //sServerThread._namePointer = "botw-studio-server";
    nn::Result result =
        nn::os::CreateThread(&sServerThread, ServerThread, nullptr, threadStack, stackSize, 16, 0);
    if (result.IsFailure()) {
        sStatus = 1;
        return;
    }

    nn::os::StartThread(&sServerThread);
    
}

bool Server::Init() {
    
    // Initialize nifm (Network Interface Module)
    nn::Result result = nn::nifm::Initialize();
    if (result.IsFailure()) {
        sStatus = 9;
        return false;
    }

    void* pool = memalign(0x1000, SOCKET_POOL_SIZE);
    result = nn::socket::Initialize(pool, SOCKET_POOL_SIZE, SOCKET_POOL_ALLOC_SIZE, 0x4);
    if (result.IsFailure()) {
        sStatus = 8;
        return false;
    }

    nn::nifm::SubmitNetworkRequest();
    while (nn::nifm::IsNetworkRequestOnHold()) { }

    if(!nn::nifm::IsNetworkAvailable()) {
        sStatus = 2;
        return false;
    }

    // Create a socket
    mServerSocket = nn::socket::Socket(AF_INET, SOCK_STREAM, 0);
    if(mServerSocket < 0) {
        sStatus = 3;
        return false;
    }

    // Bind socket to host
    sockaddr_in addr;
    addr.sin_family = AF_INET;
    addr.sin_port = nn::socket::InetHtons(PORT);
    #if BOTW_VERSION == 150
    nn::socket::InetAton("0.0.0.0", reinterpret_cast<in_addr*>(&addr.sin_addr.s_addr));
    #else
    nn::socket::InetAton("0.0.0.0", reinterpret_cast<nn::socket::InAddr*>(&addr.sin_addr.s_addr));
    #endif
    if(nn::socket::Bind(mServerSocket, reinterpret_cast<sockaddr*>(&addr), sizeof(addr)) < 0){
        sStatus = 4;
        return false;
    }

    // Listen for connections
    if(nn::socket::Listen(mServerSocket, 1 /* backLog */) < 0){
        sStatus = 5;
        return false;
    }

    return true;
}

bool Server::HandleClient() {
    // Accept connections
    // sockaddr_in clientAddr;
    // u32 clientAddrLen = sizeof(clientAddr);
    mClientSocket = nn::socket::Accept(mServerSocket, nullptr, nullptr);
    if(mClientSocket < 0){
        sStatus = 6;
        return false;
    }
    // Initialize
    sStatus = 7;
    mBufferLength = 0;
    mBufferOffset = 0;

    // Send hello
    GreetClient();
    sStatus = 8;
    Packet packet;
    while(ReadPacket(packet)) {
        RecvPacket(packet);
    }

    return true;
}

void Server::GreetClient() {
    Packet packet;
    packet.ResetOffset();
    packet.SetOpcode(Opcode::SwitchInfoMessage);
    packet.WriteAscii(RANGE_AND_COUNT("Hello from Switch!"));
    packet.WriteDeclaredLength();
    SendPacket(packet);
}

bool Server::ReadPacket(Packet& packet){
    // Reset the packet
    packet.Clear();
    // Write length
    u16 length = 0;
    if(!ReadPacketLength(&length)){
        return false;
    }
    packet.SetDeclaredLength(length);
    return ReadPacketData(packet.RawContent(), length);
}

bool Server::ReadPacketLength(u16* length){
    u8 buf[2];
    // Read length
    if(!ReadPacketData(buf, 2)){
        return false;
    }

    // Income data is little endian
    *length = (static_cast<u16>(buf[1]) << 8) | buf[0];
    return true;
}

bool Server::ReadPacketData(u8* pData, u16 length){
    // See if data is available in buffer
    if (mBufferOffset + length <= mBufferLength) {
        memcpy(pData, mBuffer + mBufferOffset, length);
        mBufferOffset += length;
        return true;
    }
    // Read all data from buffer first
    if (mBufferOffset < mBufferLength) {
        u16 readFromBuffer = mBufferLength - mBufferOffset;
        memcpy(pData, mBuffer + mBufferOffset, readFromBuffer);
        length -= readFromBuffer;
        pData += readFromBuffer;
        mBufferLength = 0;
        mBufferOffset = 0;
    }
    while(length > 0){
        // Read data from socket to buffer
        mBufferLength = nn::socket::Recv(mClientSocket, mBuffer, BUFFER_LENGTH, 0);
        if (mBufferLength == 0) {
            // EOD received
            return false;
        }
        // Received enough data
        if (mBufferLength >= length) {
            memcpy(pData, mBuffer, length);
            mBufferOffset = length;
            return true;
        }
        // Copy block to data
        memcpy(pData, mBuffer, mBufferLength);
        length -= mBufferLength;
        pData += mBufferLength;
    }
    // if size in buffer is exactly the same as length
    return true;
}

void Server::ReleaseClient() {
    for (u32 i=0;i<NUM_SESSIONS;i++) {
        if(mSessionInUse[i]){
            // Free the session slot
            mSessionInUse[i] = false;
            // Deactivate the session if needed
            if (mSessions[i] != nullptr) {
                mSessions[i]->Deactivate();
                mSessions[i] = nullptr;
            }
        }
    }
}

void Server::SendPacket(Packet& packet){
    sead::ScopedLock<sead::CriticalSection> lock(&mWriteLock);
    nn::socket::Send(mClientSocket, packet.Buffer(), packet.GetLength(), 0);
}

void Server::RecvPacket(Packet& packet) {
    Opcode opcode;
    if(!packet.GetOpcode(opcode)){
        return;
    }
    packet.ResetOffset();
    switch(opcode) {
        case Opcode::ActivateModule: {
            u8 serial;
            if(!packet.ReadInt8(serial)){
                return;
            }
            u16 moduleId;
            if(!packet.ReadInt16(moduleId)){
                return;
            }
            ActivateModule(serial, static_cast<mod::Module>(moduleId), packet);
        }
        default:
            // Ignore unknown packets
            break;
    }
}

void Server::ActivateModule(u8 serial, mod::Module moduleId, Packet& packet) {
    // Find a free session slot
    // TODO implement this
}
}