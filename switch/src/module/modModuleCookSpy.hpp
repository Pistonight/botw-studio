#pragma once

#include <types.h>
#include <server/svrSession.hpp>
#include <server/svrSessionMgr.hpp>
#include "modListener.hpp"

namespace uks::svr {
class Server;
}

namespace uks::mod {

struct CookSpyData {
    u8 mCritChance;
};
    
class ModuleCookSpy {
public:
    static ModuleCookSpy& GetInstance()
    {
        return sInstance;
    }
    
private:
    static ModuleCookSpy sInstance;
    ModuleCookSpy() {}

public:
    ModuleCookSpy(ModuleCookSpy const&) = delete;
    void operator=(ModuleCookSpy const&) = delete;
    // Init the module, install hooks etc
    void Init() {}

private:
    ListenerMgr<CookSpyData> mListenerMgr;
public:
    void AddListener(Listener<CookSpyData>* pListener) {
        mListenerMgr.AddListener(pListener);
    }
    void RemoveListener(Listener<CookSpyData>* pListener) {
        mListenerMgr.RemoveListener(pListener);
    }

};

class SessionCookSpy;
using SessionMgrCookSpy = svr::SessionMgr<SessionCookSpy, 1>;

class SessionCookSpy : public svr::Session, Listener<CookSpyData> {
public:
    SessionCookSpy() {}
    virtual ~SessionCookSpy() {}

    void SetServer(svr::Server* pServer) { mpServer = pServer; }
    void SetSessionMgr(SessionMgrCookSpy* pMgr) { mpSessionMgr = pMgr; }

    virtual void Activate() override;
    virtual void Deactivate() override;
    virtual void GetData() override {};

    virtual void OnNotify(CookSpyData& data) override;

private:
    SessionMgrCookSpy* mpSessionMgr = nullptr;
    svr::Server* mpServer = nullptr;
};


}