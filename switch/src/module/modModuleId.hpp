#pragma once

#include <types.h>
#include "modModuleCookSpy.hpp"

namespace uks::mod {

enum Module: u16 {
    CookSpy = 1,
};

inline void InitAllModules() {
    ModuleCookSpy::GetInstance().Init();
}

}