"""
Check the built elf against dumped symbols

Example: objdump -T build/botw-gametools.elf > build/botw-gametools.syms && python tools/check_elf.py build/botw-gametools.syms 1.5.0

"""
import sys
from gen_syms_ld import DATA_SYMBOL_PATH, FUNC_SYMBOL_PATH, read_uking_data_symbols, read_uking_func_symbols

EXPORTED = set([
    "exl_module_init",
    "exl_exception_entry"
    # "__custom_fini",
    # "skyline_tcp_send_raw",
    # "getRegionAddress",
    # "A64HookFunction",
    # "A64InlineHook",
    # "sky_memcpy",
    # "get_program_id",
    # "get_plugin_addresses",
])
FALSE_POSITIVES = set([
    ".text",
    ".data",
    "__register_frame_info",
    "__deregister_frame_info"
])

def run(target_syms_path, version):
    """Main"""
    print("Checking for unlinked symbols")

    print(f"Ignoring {len(EXPORTED) + len(FALSE_POSITIVES)} known symbols")
    botw_symbols = set()
    botw_symbols_dir = f"tools/dumped_symbols/{version}"
    read_symbols_to_set(f"{botw_symbols_dir}/main.syms", botw_symbols)
    read_symbols_to_set(f"{botw_symbols_dir}/rtld.syms", botw_symbols)
    read_symbols_to_set(f"{botw_symbols_dir}/sdk.syms", botw_symbols)
    read_symbols_to_set(f"{botw_symbols_dir}/subsdk0.syms", botw_symbols)
    print(f"Loaded {len(botw_symbols)} symbols from botw {version}")

    target_symbols = set()
    read_symbols_to_set(target_syms_path, target_symbols)
    print(f"Loaded {len(target_symbols)} symbols from {target_syms_path}")

    difference = target_symbols - botw_symbols - EXPORTED - FALSE_POSITIVES
    count = len(difference)
    if count > 0:
        print(f"The following {count} symbols are supposed to be statically linked:")
        for sym in difference:
            print(f"\t{sym}")
        found_symbols = set()
        if version == "1.6.0":
            print("For 1.6.0, you must manually find the addresses of these symbols and link them")
        else:
            print("Searching for potential symbols in 1.5.0 uking data...")
            
            potential_matches = []
            uking_data_symbol_map = {}
            read_uking_data_symbols(DATA_SYMBOL_PATH, set(), uking_data_symbol_map)
            for sym in difference:
                if sym in uking_data_symbol_map:
                    potential_matches.append(f"/* [1.5.0][link-data] symbol={sym} */")
                    found_symbols.add(sym)

            if len(found_symbols) < count:
                print("Searching for potential matched symbols in uking functions...")
                uking_func_symbol_map = {}
                read_uking_func_symbols(FUNC_SYMBOL_PATH, set(), uking_func_symbol_map)
                for sym in difference - found_symbols:
                    if sym in uking_func_symbol_map:
                        potential_matches.append(f"/* [1.5.0][link-func] symbol={sym} */")
                        found_symbols.add(sym)
            if potential_matches:
                print("Potential matches found:")
                for line in potential_matches:
                    print(line)
        if len(found_symbols) < count:
            print("The following symbols cannot be automatically matched:")
            for sym in difference - found_symbols:
                print(f"\t{sym}")

        print()
        print("To fix the issue:")
        print("1) Add the missing symbols to a source file")
        print("2) Run \"just relink\" to regenerate the linker script and link")
    else:
        print(f"\033[1;33m{target_syms_path} looks good for {version}\033[0m")
    return count

def read_symbols_to_set(path, symbol_set):
    """Read the symbols from file and add to set"""
    with open(path, "r", encoding="utf-8") as file:
        for i,line  in enumerate(file):
            if i<4:
                continue # skip the header stuff
            if len(line.strip())==0:
                continue
            symbol = get_symbol_from_line(line)
            symbol_set.add(symbol)

def get_symbol_from_line(line):
    """Get the symbol from a line in objdump"""
    stripped = line[25:] # strips first 25 characters, that will leave us nicer formatting
    # print(stripped.split(" "))
    return stripped.split(" ")[1].strip()

if __name__ == "__main__":
    sys.exit(run(sys.argv[1], sys.argv[2]))