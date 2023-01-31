#pragma once

namespace uks::util {

template<typename T>
class List {
public:
    List() {}
    ~List() {}

    void Push(T* p_t) {
        p_t->mNext = mFirst;
        mFirst = p_t;
    }
    T* Pop() {
        if(!mFirst) {
            return nullptr;
        }
        T* p_t = mFirst;
        mFirst = mFirst->mNext;
        return p_t;
    }
    void Remove(T* p_t) {
        if (mFirst == p_t) {
            mFirst = p_t->mNext;
            return;
        }
        T* pPrev = mFirst;
        while (pPrev) {
            if (pPrev->mNext == p_t) {
                pPrev->mNext = p_t->mNext;
                return;
            }
            pPrev = pPrev->mNext;
        }
    }

    T* GetFirst() {
        return mFirst;
    }

private:
    T* mFirst = nullptr;
};

}