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
        Listener<T>* p_listener = mListeners.Pop();
        while (p_listener) {
            p_listener->mNext = nullptr;
            p_listener = mListeners.Pop();
        }
    }

    void AddListener(Listener<T>* p_listener) {
        sead::ScopedLock<sead::CriticalSection> lock(&mCriticalSection);
        mListeners.Push(p_listener);
    }
    void RemoveListener(Listener<T>* p_listener) {
        sead::ScopedLock<sead::CriticalSection> lock(&mCriticalSection);
        mListeners.Remove(p_listener);
        p_listener->mNext = nullptr;
    }
    void Notify(T& t) {
        sead::ScopedLock<sead::CriticalSection> lock(&mCriticalSection);
        Listener<T>* p_listener = mListeners.GetFirst();
        while (p_listener) {
            p_listener->OnNotify(t);
            p_listener = p_listener->mNext;
        }
    }

private:
    sead::CriticalSection mCriticalSection;
    util::List<Listener<T>> mListeners;
};

}