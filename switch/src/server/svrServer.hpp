#pragma once
#include <thread/seadCriticalSection.h>
#include <module/modModuleCookSpy.hpp>
#include <module/modModuleId.hpp>

#define NUM_SESSIONS 32
#define PORT 64533
#define BUFFER_LENGTH 0x1000

// 1.5.0 SDK nn::socket::InetAton is not compatible with 1.6.0
// Duplicating declaration heres
struct in_addr;
namespace nn::socket {
u32 InetAton(const char* addressStr, in_addr* addressOut);
}



namespace uks::svr {

class Packet;
u32 GetSvrStatus();

class Server {
public:
    
    Server(u16 port) {
        mPort = port;
    }
    ~Server() {}

    bool Init();
    bool HandleClient();
    void ReleaseClient();
    void Uninit() {}

    void SendPacket(Packet& packet);

private:
    u16 mPort = PORT;
    s32 mServerSocket = -1;
    s32 mClientSocket = -1;
    u8 mBuffer[BUFFER_LENGTH];
    u32 mBufferLength = 0;
    u32 mBufferOffset = 0;
    sead::CriticalSection mWriteLock;

    Session* mSessions[NUM_SESSIONS];
    bool mSessionInUse[NUM_SESSIONS];
    SessionMgr<mod::SessionCookSpy, 1> mSessionCookSpyMgr;

    bool ReadPacket(Packet& packet);
    bool ReadPacketLength(u16* length);
    bool ReadPacketData(u8* p_data, u16 length);

    void GreetClient();
    void RecvPacket(Packet& packet);
    void ActivateModule(u8 serial, mod::Module module_id, Packet& packet);
};

void RunServer();

}