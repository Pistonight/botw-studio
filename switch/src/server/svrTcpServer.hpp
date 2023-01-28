#pragma once

#define NUM_SESSIONS 32

namespace uks::svr {

class Session {
public:
    Session();
    virtual ~Session();

    virtual void Activate();
    virtual void Deactivate();
    virtual void GetData();
};

class TcpServer {
public:
    TcpServer();
    ~TcpServer();
    
    void Start();

private:
    Session mSessions[NUM_SESSIONS];
};

}