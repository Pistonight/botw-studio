#pragma once
#include <string.h>
#include <types.h>

#define MAX_PACKET_SIZE 0xFFFF

namespace uks::svr {

enum Opcode: u16 {
    // Messages
    SwitchDebugMessage = 0x1000,
    SwitchInfoMessage = 0x1100,
    SwitchWarnMessage = 0x1200,
    SwitchErrorMessage = 0x1300,
    // Modules
    ActivateModule = 0x0001,
    DeactivateModule = 0x0002,
    FreeSession = 0x0102,
    GetData = 0x0202,
    ModuleData = 0x1202,
};

class Packet {
public:
    
    Packet() {};
    ~Packet() {};

    void Clear() {
        mLength = 0;
        mOffset = 0;
    }
    void ResetOffset() {
        // 2 bytes length + 2 bytes opcode
        mOffset = 4;
        mLength = 4;
    }
    const u8* Buffer() {
        return mBuffer;
    }
    u8* RawContent() {
        return mBuffer+2;
    }

    u16 GetLength() {
        return mLength;
    }
    bool GetDeclaredLength(u16& length) {
        return ReadInt16At(0, length);
    }
    void SetDeclaredLength(u16 length) {
        WriteInt16At(0, length);
        mLength = length;
    }
    void WriteDeclaredLength() {
        SetDeclaredLength(GetLength());
    }
    // Get the opcode
    bool GetOpcode(Opcode& opcode) {
        u16 value;
        if(!ReadInt16At(2, value)){
            return false;
        }
        opcode = static_cast<Opcode>(value);
        return true;
    }
    void SetOpcode(Opcode opcode) {
        WriteInt16At(2, static_cast<u16>(opcode));
    }

    bool ReadInt8(u8& value) {
        return ReadInt8At(mOffset++, value);
    }
    bool ReadInt8At(u32 i, u8& value);

    bool WriteInt8(u8 value) {
        mLength = mOffset+1;
        return WriteInt8At(mOffset++, value);
    }
    bool WriteInt8At(u32 i, u8 value);

    bool ReadInt16(u16& value) {
        if(!ReadInt16At(mOffset, value)){
            return false;
        }
        mOffset+=2;
        return true;
    }
    bool ReadInt16At(u32 i, u16& value);

    bool WriteInt16(u16 value) {
        mLength = mOffset+2;
        if(!WriteInt16At(mOffset, value)){
            return false;
        }
        mOffset+=2;
        return true;
    }
    bool WriteInt16At(u32 i, u16 value);

    // Return length of the string read excluding the null terminator
    // max char to read is bufferLength, including the null terminator
    // on error returns -1
    s32 ReadAscii(char* buffer, u16 bufferLength) {
        s32 length = ReadAsciiAt(mOffset, buffer, bufferLength);
        if(length < 0){
            return -1;
        }
        mOffset += length+1;
        return length;
    }
    
    s32 ReadAsciiAt(u32 i, char* buffer, u32 bufferLength);

    // Write the null-terminated string at the given offset
    // max char to write is bufferLength, excluding the null terminator
    // return number of chars written excluding the null terminator
    bool WriteAscii(const char* buffer, u32 bufferLength) {
        // uncapped length
        mLength = MAX_PACKET_SIZE;
        s32 length = WriteAsciiAt(mOffset, buffer, bufferLength);
        if(length < 0){
            return false;
        }
        mOffset += length+1;
        mLength = mOffset;
        return true;
    }

    s32 WriteAsciiAt(u32 i, const char* buffer, u32 bufferLength);

private:
    u8 mBuffer[MAX_PACKET_SIZE];
    u16 mLength = 0;
    u32 mOffset = 0;
};
}