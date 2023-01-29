#include <lib.hpp>
#include <module/modModuleId.hpp>
#include <screen/screen.hpp>
#include <server/svrServer.hpp>

namespace uks {

void EntryPoint() {
    screen::Init();
    mod::InitAllModules();
    svr::RunServer();
}

}

extern "C" void exl_main(void* x0, void* x1) {
    /* Setup hooking enviroment. */
    envSetOwnProcessHandle(exl::util::proc_handle::Get());
    exl::hook::Initialize();

    // Call application entry point
    uks::EntryPoint();
}

