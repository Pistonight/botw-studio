#pragma once

#include <types.h>

namespace uks::util {
void Init();
inline const char* GetTargetVersion() {
#if BOTW_VERSION == 150
    return "1.5.0";
#elif BOTW_VERSION == 160
    return "1.6.0";
#else
    return "?.?.?";
#endif
}
// get version from module size
const char* GetRuntimeVersion();
// get version from nn::oe::GetDisplayVersion. layered fs will not affect this
const char* GetInstalledVersion();
}