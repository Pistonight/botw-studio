#include <string.h>
#include <nn/oe.h>
#include "utilVersion.hpp"

namespace botwgametools::util {

static char s_versionStringCache[16] = "";
char* GetRuntimeVersion() {
    if (s_versionStringCache[0] == '\0') {
        nn::oe::DisplayVersion displayVersion;
        nn::oe::GetDisplayVersion(&displayVersion);
        strncpy(s_versionStringCache, displayVersion.name, 16);
        if (s_versionStringCache[0] == '\0') {
            s_versionStringCache[0] = '?';
            s_versionStringCache[1] = '\0';
        }
    }
    return s_versionStringCache;
}
static u32 s_runtimeVersionCache = 0;
u32 GetRuntimeVersionHash() {
    // Note that this is not thread-safe, which is fine for performance
    if (s_runtimeVersionCache == 0) {
        char* version = GetRuntimeVersion();
        // Hash the version with djb2
        u32 hash = 5381;
        for(int i=0;i<16 /*name buffer length*/;i++) {
            /* hash * 33 + c */
            hash = ((hash << 5) + hash) + static_cast<u32>(version[i]); 
        }
        s_runtimeVersionCache = hash;
    }
    return s_runtimeVersionCache;
}

}