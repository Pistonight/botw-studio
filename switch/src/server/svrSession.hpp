#pragma once

namespace uks::svr {

class Session {
public:
    Session() {}
    virtual ~Session() {};

    virtual void Activate() = 0;
    virtual void Deactivate() = 0;
    virtual void GetData() = 0;

    void SetSessionId(u8 session_id) {
        mSessionId = session_id;
    }

protected:
    u8 mSessionId = 0;
};

}