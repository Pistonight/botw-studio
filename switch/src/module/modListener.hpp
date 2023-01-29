#pragma once

#include <types.h>
#include <thread/seadCriticalSection.h>
#include <prim/seadScopedLock.h>
#include <util/utilList.hpp>

namespace uks::mod {

template<typename T>
class Listener {
public:
    Listener();
    ~Listener();

    virtual void OnNotify(T& t) = 0;

    Listener<T>* mNext;

};

template<typename T>
class ListenerMgr {
public:
    ListenerMgr() {}
    ~ListenerMgr() {
        sead::ScopedLock<sead::CriticalSection> lock(&mCriticalSection);
        Listener<T>* pListener = mListeners.Pop();
        while (pListener) {
            pListener->mNext = nullptr;
            pListener = mListeners.Pop();
        }
    }

    void AddListener(Listener<T>* pListener) {
        sead::ScopedLock<sead::CriticalSection> lock(&mCriticalSection);
        mListeners.Push(pListener);
    }
    void RemoveListener(Listener<T>* pListener) {
        sead::ScopedLock<sead::CriticalSection> lock(&mCriticalSection);
        mListeners.Remove(pListener);
        pListener->mNext = nullptr;
    }
    void Notify(T& t) {
        sead::ScopedLock<sead::CriticalSection> lock(&mCriticalSection);
        Listener<T>* pListener = mListeners.GetFirst();
        while (pListener) {
            pListener->OnNotify(t);
            pListener = pListener->mNext;
        }
    }

private:
    sead::CriticalSection mCriticalSection;
    util::List<Listener<T>> mListeners;
};

}