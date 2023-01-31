#pragma once

#include <types.h>

namespace uks::svr {
template<typename T, u32 L>
class SessionMgr {
public:
    SessionMgr() {}
    ~SessionMgr() {}

    T* Allocate() {
        if(mNext >= L) {
            mNext = 0;
        }
        u32 i = mNext;
        for (; i < L; i++) {
            T* pT = TryAllocateAt(i);
            if(pT){
                return pT;
            }
        }
        for (i = 0; i < mNext; i++) {
            T* pT = TryAllocateAt(i);
            if(pT){
                return pT;
            }
        }
        return nullptr;
    }

    void Free(T* p_t) {
        for (u32 i = 0; i < L; i++) {
            if (reinterpret_cast<T*>(&mSessions[i*sizeof(T)]) == p_t) {
                mAllocated[i] = false;
                return;
            }
        }
    }

private:
    u8 mSessions[L * sizeof(T)];
    bool mAllocated[L];
    u32 mNext = 0;

    T* TryAllocateAt(u32 i) {
        if (mAllocated[i]) {
            return nullptr;
        }
        mAllocated[i] = true;
        mNext = i+1;
        new (&mSessions[i*sizeof(T)]) T;
        return &mSessions[i*sizeof(T)];
    }
};
}