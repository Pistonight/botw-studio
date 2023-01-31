#include <lib.hpp>
#include <util/utilVersion.hpp>
#include <module/modModuleId.hpp>
#include <screen/screen.hpp>
#include <server/svrServer.hpp>

namespace uks {

void EntryPoint() {
    screen::Init();
    mod::InitAllModules();
    //svr::RunServer();
    util::Init();
}

}

extern "C" void exl_main(void* x0, void* x1) {
    /* Setup hooking enviroment. */
    exl::hook::Initialize();

    // Call application entry point
    uks::EntryPoint();
}

extern "C" NORETURN void exl_exception_entry() {
    /* TODO: exception handling */
    EXL_ABORT(0x420);
}