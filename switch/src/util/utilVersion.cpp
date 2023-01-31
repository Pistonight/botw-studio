#include <string.h>
#include <lib.hpp>
#include <nn/oe.h>
#include "utilVersion.hpp"

namespace uks::util {

static char sInstalledVersion[16] = "";
static char sRuntimeVersion[6] = "1.?.0";
void Init() {
    nn::oe::DisplayVersion display_version;
    nn::oe::GetDisplayVersion(&display_version);
    strncpy(sInstalledVersion, display_version.name, 16);
    if (sInstalledVersion[0] == '\0') {
        sInstalledVersion[0] = '?';
        sInstalledVersion[1] = '\0';
    }

    uintptr_t module_start = exl::util::modules::GetTargetStart();
    uintptr_t self_start = exl::util::modules::GetSelfStart();
    if (self_start - module_start == 0x2d91000) {
        sRuntimeVersion[2] = '5';
    }else if (self_start - module_start == 0x3483000) {
        sRuntimeVersion[2] = '6';
    }
}
const char* GetInstalledVersion() {
    return sInstalledVersion;
}

const char* GetRuntimeVersion() {
    return sRuntimeVersion;
}

}