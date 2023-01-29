#include <server/svrPacket.hpp>
#include <server/svrServer.hpp>
#include <util/utilMacros.hpp>
#include "modModuleCookSpy.hpp"
#include "modModuleId.hpp"

namespace uks::mod {

void SessionCookSpy::Activate() {
    ModuleCookSpy::GetInstance().AddListener(this);
}

void SessionCookSpy::Deactivate() {
    ModuleCookSpy::GetInstance().RemoveListener(this);
    mpSessionMgr->Free(this);
}

void SessionCookSpy::OnNotify(CookSpyData& data) {
    svr::Packet packet;
    packet.ResetOffset();
    packet.SetOpcode(svr::Opcode::ModuleData);
    IF_FALSE_RETURN(packet.WriteInt8(mSessionId));
    IF_FALSE_RETURN(packet.WriteInt16(Module::CookSpy));
    IF_FALSE_RETURN(packet.WriteInt8(data.mCritChance));
    packet.WriteDeclaredLength();
    mpServer->SendPacket(packet);
}
}