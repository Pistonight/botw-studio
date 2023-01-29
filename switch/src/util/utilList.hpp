#pragma once

namespace uks::util {

template<typename T>
class List {
public:
    List();
    ~List();

    void Push(T* pT) {
        pT->mNext = mFirst;
        mFirst = pT;
    }
    T* Pop() {
        if(!mFirst) {
            return nullptr;
        }
        T* pT = mFirst;
        mFirst = mFirst->mNext;
        return pT;
    }
    void Remove(T* pT) {
        if (mFirst == pT) {
            mFirst = pT->mNext;
            return;
        }
        T* pPrev = mFirst;
        while (pPrev) {
            if (pPrev->mNext == pT) {
                pPrev->mNext = pT->mNext;
                return;
            }
            pPrev = pPrev->mNext;
        }
    }

    T* GetFirst() {
        return mFirst;
    }

private:
    T* mFirst;
};

}