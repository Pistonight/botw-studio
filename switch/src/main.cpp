#include <lib.hpp>

#include <screen/screen.hpp>

namespace uking::studio {

void EntryPoint() {
    screen::Init();
}

}

extern "C" void exl_main(void* x0, void* x1) {
    /* Setup hooking enviroment. */
    envSetOwnProcessHandle(exl::util::proc_handle::Get());
    exl::hook::Initialize();

    // Call application entry point
    uking::studio::EntryPoint();
}

