#pragma once

#include "utilVersion.hpp"

#define Ver160_Hash 1
#define Ver150_Hash 0x5b0ed718
#define IsVer160 (uking::studio::util::GetRuntimeVersionHash() == Ver160_Hash)
#define IsVer150 (uking::studio::util::GetRuntimeVersionHash() == Ver150_Hash)
#define VerString (IsVer160 ? "v1.6.0" : (IsVer150 ? "v1.5.0" : "Unknown Version"))

#define MULTIVER_DATA_SYMBOL(type, symbol) \
    extern type symbol##_v150; \
    extern type symbol##_v160

#define MULTIVER_FUNC_SYMBOL(type, symbol, args) \
    extern type symbol##_v150 args; \
    extern type symbol##_v160 args

#define MULTIVER(symbol) (IsVer160 ? symbol##_v150 : symbol##_v160)

namespace act {
class ActorSystem;
}

MULTIVER_DATA_SYMBOL(act::ActorSystem*, s_ActorSystem);
MULTIVER_FUNC_SYMBOL(act::ActorSystem*, GetActorSystem, (int, int));


act::ActorSystem* GetSymbol() {
    auto test = MULTIVER(s_ActorSystem);
    MULTIVER(GetActorSystem)(1,2);
}