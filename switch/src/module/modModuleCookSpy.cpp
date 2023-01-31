#include <lib.hpp>
#include <Game/Cooking/cookManager.h>
#include <glue/uking/CookingMgr.h>
#include <server/svrPacket.hpp>
#include <server/svrServer.hpp>
#include <util/utilMacros.hpp>
#include "modModuleCookSpy.hpp"
#include "modModuleId.hpp"

namespace uks::mod {
static CookSpyData sCookSpyData;
CookSpyData& GetCookSpyData() {
    return sCookSpyData;
}

static ModuleCookSpy sModuleCookSpyInstance; 
ModuleCookSpy& ModuleCookSpy::GetInstance() {
    return sModuleCookSpyInstance;
}

// Hook cook function to update stuff whenever a cook is done
HOOK_DEFINE_TRAMPOLINE(CookingMgrCookHook) {
    static bool Callback(uking::CookingMgr* p_this, const uking::CookArg& arg, uking::CookItem& cook_item, const uking::CookingMgr::BoostArg& boost_arg) {
        bool value = Orig(p_this, arg, cook_item, boost_arg);
        // Update results
        CookSpyData& data = GetCookSpyData();
        data.mIsCrit = cook_item.is_crit;
        ModuleCookSpy::GetInstance().Nofity();
        return value;
    }
};

// Inline hook to update crit chance
HOOK_DEFINE_INLINE(CookingMgrGetCritChanceHook) {
    static void Callback(exl::hook::InlineCtx* p_ctx) {
        // 0x008A09D8 CMP W8, W22
        CookSpyData& data = GetCookSpyData();
        u64 rng_data = (p_ctx->X[0]) * u64(100) >> 32u;
        data.mRngRoll = rng_data & 0xff;
        data.mCritChance = p_ctx->W[22] & 0xff;
    }
};

void ModuleCookSpy::Init() {
#if BOTW_VERSION == 150 // only supported for 1.5.0 for now
    CookingMgrGetCritChanceHook::InstallAtOffset(0x008A09CC);
    CookingMgrCookHook::InstallAtOffset(mainoff(uking::CookingMgr::cook));
#endif
}

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