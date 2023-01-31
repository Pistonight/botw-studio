#include "svrPacket.hpp"

namespace uks::svr {

bool Packet::ReadInt8At(u32 i, u8& value) {
    if(i >= mLength){
        return false;
    }
    value = mBuffer[i];
    return true;
}

bool Packet::WriteInt8At(u32 i, u8 value) {
    if(i >= mLength){
        return false;
    }
    mBuffer[i] = value;
    return true;
}

bool Packet::ReadInt16At(u32 i, u16& value) {
    if(i+1 >= mLength){
        return false;
    }
    value = static_cast<u16>(mBuffer[i+1] << 8) | mBuffer[i];
    return true;
}

bool Packet::WriteInt16At(u32 i, u16 value) {
    if(i+1 >= mLength){
        return false;
    }
    mBuffer[i+1] = (value >> 8) & 0xFF;
    mBuffer[i] = value & 0xFF;
    return true;
}

s32 Packet::ReadAsciiAt(u32 i, char* buffer, u32 buffer_length) {
    u8 next = 0;
    u32 j = 0;
    while (ReadInt8At(i++, next)) {
        if (next == 0) {
            if (j < buffer_length) {
                buffer[j] = 0;
            }
            // ensure null terminator
            buffer[buffer_length-1] = 0;
            return j;
        }
        // If buffer is not enough to fit all content
        // keep reading until we find the null terminator
        if (j < buffer_length) {
            buffer[j++] = next;
        }
    }
    // error case
    return -1;
}

s32 Packet::WriteAsciiAt(u32 i, const char* buffer, u32 buffer_length) {
    u8 next = buffer[0];
    u32 j = 0;
    while(WriteInt8At(i++, next)) {
        if(next == 0){
            return j;
        }
        j++;
        if (j >= buffer_length){
            // ensure null terminator
            next = 0;
        }else{
            next = buffer[j];
        }
    }

    // error case
    return -1;
}

}