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
    u8 mCritChance = 0;
    u8 mRngRoll = 0;
    bool mIsCrit = false;
};

CookSpyData& GetCookSpyData();

class ModuleCookSpy {
public:
    static ModuleCookSpy& GetInstance();
    
public:
    ModuleCookSpy() {}

public:
    ModuleCookSpy(ModuleCookSpy const&) = delete;
    void operator=(ModuleCookSpy const&) = delete;
    // Init the module, install hooks etc
    void Init();

private:
    ListenerMgr<CookSpyData> mListenerMgr;
public:
    void AddListener(Listener<CookSpyData>* p_listener) {
        mListenerMgr.AddListener(p_listener);
    }
    void RemoveListener(Listener<CookSpyData>* p_listener) {
        mListenerMgr.RemoveListener(p_listener);
    }
    void Nofity() {
        mListenerMgr.Notify(GetCookSpyData());
    }

};

class SessionCookSpy;
using SessionMgrCookSpy = svr::SessionMgr<SessionCookSpy, 1>;

class SessionCookSpy : public svr::Session, Listener<CookSpyData> {
public:
    SessionCookSpy() {}
    virtual ~SessionCookSpy() {}

    void SetServer(svr::Server* p_server) { mpServer = p_server; }
    void SetSessionMgr(SessionMgrCookSpy* p_mgr) { mpSessionMgr = p_mgr; }

    virtual void Activate() override;
    virtual void Deactivate() override;
    virtual void GetData() override {};

    virtual void OnNotify(CookSpyData& data) override;

private:
    SessionMgrCookSpy* mpSessionMgr = nullptr;
    svr::Server* mpServer = nullptr;
};


}