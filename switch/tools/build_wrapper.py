"""
Wrapper for build.mk that manipulates the source and checks the elf

Example: python tools/build_wrapper.py 150

Build Graph:
       │
       │
    ┌──▼───────────────┐--relink
    │ Initialize       ├─────────┐
    └──┬───────────────┘         │
       │                         │
FAIL┌──▼───────────────┐      ┌──▼───────────────┐
  ┌─┤ Linker Script    ◄──────┤ Prepare Relink   ◄─┬──────┐
  │ └──┬───────────────┘      └──────────────────┘ │      │
  │    │                                           │      │OK
FAIL┌──▼───────────────┐      ┌──────────────────┐ │   ┌──┴───────────────┐
  ├─┤ Run Make         ◄──────┤ Prepare Rebuild  │ │   │ Botw Symbol Scan │
  │ └──┬───────────────┘      └──▲───────────────┘ │   └──▲───┬───────────┘
  │    │OK                       │1st              │OK    │   │FAIL
  │ ┌──▼───────────────┐         │   ┌─────────────┴────┐ │   │
  │ │ Check Binary     ├─────────┴───► Configure Linker ├─┘   │
  │ └──┬───────────────┘         2nd+└──────────────────┘FAIL │
  │    │OK                                                    │
  │ ┌──▼───────────────┐                                      │
  └─► Cleanup          ◄──────────────────────────────────────┘
    └──┬───────────────┘
       │
       ▼

Initialize:       Moving files, read linker config
Linker Script:    Generate linker script from config
Run Make:         make
Check Binary:     Check if the elf contains unlinked symbols
Prepare Rebuild:  Remove existing linker script and binary
Configure Linker: Change linker config based on missing symbols
Botw Symbol Scan: Scan botw symbol listing for missing symbols
Prepare Relink:   Removing binary to relink
Cleanup:          Moving files, save linker config

Build flags:
-r --relink           Add Prepare Relink before Linker Script
-c --clean-linker     Initial Stack: Cleanup | Prepare Rebuild | Initialize
-v --verbose          More logs
-l --local            Use local botw data set by BOTW_LOCAL in env  
"""
import csv
import subprocess
import os
import sys

LINKER_SCRIPT_HEADER = """
/*
 * This linker script is generated from config files in config/linker
 * CHANGES WILL BE LOST
 */
"""
LINKER_CONFIG_HEADER = """
# Linker Config
#
# This file contains symbols and their relative address in the botw main module
# "base" is the absolute address of the main module
# "manual" and "auto" are used to generate linker script
# "auto" are the ones found by the build tool from the symbol listing
# "unused" are not used to generate linker script
"""
UNLINKED_SYMBOLS_IGNORE = set([
    "exl_module_init",
    "exl_exception_entry",
    ".text",
    ".data",
    "__register_frame_info",
    "__deregister_frame_info",
])
BOTW_PATH = "libs/botw"

def print_error(text):
    print(f"\033[1;31m{text}\033[0m")

def print_good(text):
    print(f"\033[1;32m{text}\033[0m")

def log(text):
    if not VERBOSE:
        return
    print(text)
class LinkerConfig:
    base: str
    entries: dict
    addr_comments: dict
    version: str

    symbol_to_addr: dict
    manual_unused: set

    def __init__(self, version):
        self.version = version

    def config_filename(self):
        return f"config/linker/{self.version}_symbols.yaml"

    def load(self):
        self.base = "0x0"
        self.entries = {
            "auto": {},
            "manual": {},
            "unused": {}
        }
        self.symbol_to_addr = None
        self.manual_unused = set()
        self.addr_comments = []
        reading_mode = ""
        filename = self.config_filename()
        log(f"Loading linker config from {filename}")
        count = 0
        with open(filename, "r", encoding="utf-8") as config_file:
            for line in config_file:
                parts = line.split("#", 1)
                line =  parts[0].strip()
                if not line:
                    continue
                key, value = [ x.strip() for x in line.split(":", 1)]
                if key == "base":
                    self.base = value
                    continue
                if not value:
                    reading_mode = key
                    continue
                if not reading_mode in self.entries:
                    return f"Unknown mode \"{reading_mode}\""
                self.entries[reading_mode][key] = value
                if len(parts) > 1:
                    self.addr_comments[key] = "#"+parts[1].rstrip()
                count+=1
        log(f"Loading {count} entrie(s) from linker config")
        return None

    def save(self):
        filename = self.config_filename()
        log(f"Saving linker config to {filename}")
        count = 0
        self.add_unused()
        with open(filename, "w+", encoding="utf-8") as config_file:
            config_file.write(LINKER_CONFIG_HEADER+"\n\n")
            config_file.write(f"base: {self.base}\n")
            for mode in self.entries:
                config_file.write("\n")
                config_file.write(f"{mode}:\n")
                for addr in self.entries[mode]:
                    comment = ""
                    if addr in self.addr_comments:
                        comment = self.addr_comments[addr]
                    count+=1
                    config_file.write(f"  {addr}: {self.entries[mode][addr]} {comment}\n")
        log(f"Written {count} entrie(s) to linker config")

    def build(self, dry=False): 
        filename = f"build_{self.version}/syms.ld"
        log(f"Writing linker script to {filename}")
        count = 0
        self.add_unused()
        with open(filename, "w+", encoding="utf-8") as linker_script:
            linker_script.write(LINKER_SCRIPT_HEADER+"\n\n")
            if dry:
                return
            for mode in ["auto", "manual"]:
                for addr in self.entries[mode]:
                    count+=1
                    linker_script.write(f"{self.entries[mode][addr]} = {addr} - {self.base};\n")
        log(f"Written {count} entrie(s) to linker script")

    def find(self, symbol):
        if self.symbol_to_addr is None:
            log("Optimizing linker config")
            self.symbol_to_addr = {}
            
            for mode in self.entries:
                for addr in self.entries[mode]:
                    self.symbol_to_addr[self.entries[mode][addr]] = addr
            # mark all manual entries as unused
            self.manual_unused = set(self.entries["manual"].values())
            # delete all auto entries
            self.entries["auto"] = {}
        if symbol not in self.symbol_to_addr:
            return None
        addr = self.symbol_to_addr[symbol]
        if addr in self.manual_unused:
            self.manual_unused.remove(addr)
        return addr

    def add_auto(self, addr, symbol):
        self.entries["auto"][addr] = symbol

    def add_unused(self):
        if self.symbol_to_addr is not None:
            log("Rebuilding linker config")
            for manual_unused_symbol in self.manual_unused:
                addr = self.symbol_to_addr[manual_unused_symbol]
                self.entries["unused"][addr] = manual_unused_symbol
                del self.entries["manual"][addr]
        self.symbol_to_addr = None
        self.manual_unused = set()


class SymbolDiffer:
    version: str
    is_loaded: bool
    dll_symbols: set
    def __init__(self, version):
        self.version = version
        self.dll_symbols = set()
        self.is_loaded = False

    def get_difference(self):
        if not self.is_loaded:
            log(f"Start building symbol cache")
            self.dll_symbols = set()
            botw_symbols_dir = f"tools/dumped_symbols/{self.version}"
            self.read_symbols_from(f"{botw_symbols_dir}/main.syms", self.dll_symbols)
            self.read_symbols_from(f"{botw_symbols_dir}/rtld.syms", self.dll_symbols)
            self.read_symbols_from(f"{botw_symbols_dir}/sdk.syms", self.dll_symbols)
            self.read_symbols_from(f"{botw_symbols_dir}/subsdk0.syms", self.dll_symbols)
            log(f"Ignoring {len(UNLINKED_SYMBOLS_IGNORE)} known symbols")
            for ignore in UNLINKED_SYMBOLS_IGNORE:
                self.dll_symbols.add(ignore)
            log(f"Loaded {len(self.dll_symbols)} botw symbols")
            self.is_loaded = True

        input_symbols = set()
        self.read_symbols_from(f"build_{self.version}/botw-gametools.syms", input_symbols)
        return input_symbols - self.dll_symbols

    def read_symbols_from(self, symbol_file, output):
        log(f"Loading symbols from {symbol_file}")
        count = 0
        with open(symbol_file, "r", encoding="utf-8") as file:
            for i,line  in enumerate(file):
                if i<4:
                    continue # skip the header stuff
                if len(line.strip())==0:
                    continue
                # Example
                # 0000000000000000      DF *UND*	0000000000000000 nnsocketGetPeerName
                symbol = line[25:].split(" ")[1].strip() 
                output.add(symbol)
                count += 1
        log(f"Loaded {count} symbol(s)")

# Address Prefix to strip (and check) in botw csv files
ADDR_PREFIX = "0x00000071"
def parse_address(raw_addr):
    """Strip the 0x00000071"""
    if not raw_addr.startswith(ADDR_PREFIX):
        return None
    return "0x" + raw_addr[len(ADDR_PREFIX):]
class BotwSymbolAddr:
    symbol_to_addr: dict
    addr_set: set

    def __init__(self):
        self.symbol_to_addr = None

    def find(self, symbol):
        if not self.symbol_to_addr:
            self.symbol_to_addr = {}
            data_symbol_path = f"{BOTW_PATH}/data/data_symbols.csv"
            log(f"Loading symbol listing from {data_symbol_path}")
            count = 0
            self.addr_set = set()
            with open(data_symbol_path, "r", encoding="utf-8") as csv_file:
                reader = csv.reader(csv_file)
                for row in reader:
                    # Skip invalid rows
                    if len(row) < 2:
                        continue
                    raw_addr = row[0]
                    data_name = row[1].strip()
                    if data_name:
                        result = self.add_raw(data_name, raw_addr)
                        if result:
                            return None, result

                        count+=1
            log(f"Loaded {count} symbol(s)")
            func_symbol_path = f"{BOTW_PATH}/data/uking_functions.csv"
            log(f"Loading symbol listing from {func_symbol_path}")
            count = 0
            with open(func_symbol_path, "r", encoding="utf-8") as csv_file:
                reader = csv.reader(csv_file)
                for row in reader:
                    # Skip invalid rows
                    if len(row) < 4:
                        continue
                    raw_addr = row[0]
                    # Skip the headers
                    if raw_addr == "Address":
                        continue
                    func_name = row[3].strip()
                    if func_name:
                        result = self.add_raw(func_name, raw_addr)
                        if result:
                            return None, result

                        count+=1
            log(f"Loaded {count} symbol(s)")
        if symbol in self.symbol_to_addr:
            return self.symbol_to_addr[symbol], None
        return None, None

    def add_raw(self, name, raw_addr):
        addr_str = parse_address(raw_addr)
        if addr_str is None:
            return f"Error: Invalid Address: {raw_addr}"
        if addr_str in self.addr_set:
            return f"Error: Duplicate Address: {raw_addr}"
        self.addr_set.add(addr_str)
        self.symbol_to_addr[name] = addr_str
        return None



class RenameTask:
    def __init__(self, old_name, new_name):
        self.old_name = old_name
        self.new_name = new_name
        self.need_cleanup = False

    def execute(self):
        if os.path.exists(self.old_name):
            log(f"Renaming {self.old_name} to {self.new_name}")
            os.rename(self.old_name, self.new_name)
    
    def cleanup(self):
        if os.path.exists(self.new_name):
            log(f"Renaming {self.new_name} to {self.old_name}")
            os.rename(self.new_name, self.old_name)


class Build:
    version: str
    stack: list
    tasks: list
    current_step: int
    linker_config: LinkerConfig
    symbol_differ: SymbolDiffer
    error: str
    error_source: str
    make_iteration: int
    difference_cache: set
    botw_symbols: BotwSymbolAddr
    def __init__(self, version):
        self.version = version
        self.stack = []
        self.tasks = [
            RenameTask("libs/exlaunch/source/program/main.cpp", "libs/exlaunch/source/program/main.cpp.old"),
            RenameTask("libs/exlaunch/source/program/setting.hpp", "libs/exlaunch/source/program/setting.hpp.old")
        ]
        self.current_step = 0
        self.error = ""
        self.linker_config = LinkerConfig(self.version)
        self.symbol_differ = SymbolDiffer(self.version)
        self.make_iteration = 0
        self.difference_cache = 0
        self.botw_symbols = BotwSymbolAddr()

    def build(self, relink, clean_linker):
        self.stack = [
            lambda: self.cleanup()
        ]
        if clean_linker:
            self.stack.append(
                lambda: self.prepare_rebuild(),
            )
            self.make_iteration = 1
        else:
            self.stack.extend([
                lambda: self.check_binary(),
                lambda: self.run_make(),
                lambda: self.linker_script()
            ])
        if relink:
            self.stack.append(lambda: self.prepare_relink())
        self.stack.append(lambda: self.initialize())

        self.current_step = 0
        while self.stack:
            task = self.stack.pop()
            self.current_step += 1
            task()

        return 1 if self.error else 0


    def print_step(self, step):
        print(f"\033[1;33m({self.current_step}/{self.current_step+len(self.stack)}) {step}\033[0m")

    def initialize(self):
        self.print_step("Initialize")
        for task in self.tasks:
            task.execute()
        
        result = self.linker_config.load()
        if result:
            self.stack.append(lambda: self.cleanup())
            self.error = f"Linked Script failed: {result}"
            self.error_source = "Initialize"
    
    def linker_script(self):
        self.print_step("Linker Script")
        self.linker_config.build()

    def run_make(self):
        self.make_iteration += 1
        self.print_step(f"Run Make (Iteration {self.make_iteration})")
        result = subprocess.run([
            "make",
            "-j8",
            "-C",
            f"build_{self.version}",
            "-f",
            "../config/build.mk",
            f"BOTW_VERSION={self.version}"
        ])
        if result.returncode:
            self.stack.append(lambda: self.cleanup())
            self.error = "failed"
            self.error_source = "Run Make"
        
    def check_binary(self):
        self.print_step("Check Binary")
        self.difference_cache = self.symbol_differ.get_difference()
        if self.difference_cache:
            print_error(f"{len(self.difference_cache)} Unlinked symbol(s) found!")
            if self.make_iteration == 1:
                self.stack.append(lambda: self.prepare_rebuild())
            else:
                self.stack.append(lambda: self.configure_linker())
            return
        print_good("All symbols appeared to be linked")
        

    def prepare_rebuild(self):
        self.print_step("Prepare Rebuild")
        self.linker_config.build(dry=True)
        self.stack.append(lambda: self.check_binary())
        self.stack.append(lambda: self.run_make())
        self.stack.append(lambda: self.prepare_relink())

    def configure_linker(self):
        self.print_step("Configure Linker")
        new_difference = set()
        for symbol in self.difference_cache:
            addr = self.linker_config.find(symbol)
            if not addr:
                new_difference.add(symbol)
            else:
                log(f"Resolved {symbol} = {addr}")
        log(f"Remaining symbols: {len(new_difference)}")
        self.difference_cache = new_difference
        if new_difference:
            self.stack.append(lambda: self.botw_symbol_scan())
        else:
            self.stack.append(lambda: self.check_binary())
            self.stack.append(lambda: self.run_make())
            self.stack.append(lambda: self.linker_script())
            self.stack.append(lambda: self.prepare_relink())

    def botw_symbol_scan(self):
        self.print_step("Botw Symbol Scan")
        if self.version == "160":
            self.error = "1.6.0 symbols cannot be automatically scanned.\n"
            self.error_source = "Botw Symbol Scan"
            self.stack.append(lambda: self.cleanup())
            return
        new_difference = set()
        for symbol in self.difference_cache:
            addr, error = self.botw_symbols.find(symbol)
            if error:
                self.error = error
                self.error_source = "Botw Symbol Scan"
                self.stack.append(lambda: self.cleanup())
                return
            if not addr:
                new_difference.add(symbol)
            else:
                log(f"Resolved {symbol} = {addr}")
                self.linker_config.add_auto(addr, symbol)
        log(f"Remaining symbols: {len(new_difference)}")
        self.difference_cache = new_difference
        if new_difference:
            self.error = "Some symbols cannot be automatically matched.\n"
            self.error_source = "Botw Symbol Scan"
            self.stack.append(lambda: self.cleanup())
        else:
            self.stack.append(lambda: self.check_binary())
            self.stack.append(lambda: self.run_make())
            self.stack.append(lambda: self.linker_script())
            self.stack.append(lambda: self.prepare_relink())

    def prepare_relink(self):
        self.print_step("Prepare Relink")
        files = [
            f"build_{self.version}/botw-gametools.nso",
            f"build_{self.version}/botw-gametools.elf",
            f"build_{self.version}/botw-gametools.syms",
        ]
        for file in files:
            if os.path.exists(file):
                log(f"Removing {file}")
                os.remove(file)


    def cleanup(self):
        self.stack = []
        self.print_step("Cleanup")
        for task in self.tasks:
            task.cleanup()
        self.linker_config.save()
        print()
        if self.error:
            print_error("BUILD FAILED")
            print()
            print(f"Step that failed: {self.error_source}")
            print(self.error)

            if self.difference_cache:
                print()
                print("Looks like some symbols cannot be linked:")
                for symbol in self.difference_cache:
                    print(f"  {symbol}")
                print()
                if self.version == "150":
                    print("Do one of the following and rebuild:")
                    print("1. List the mangled names of the symbols in botw decomp project")
                    print("2. Add entries to the \"manual\" section of config/linker/150.yaml")
                else:
                    print("Add the symbols to the \"manual\" section of config/linker/160.yaml and rebuild")
        else:
            print_good("BUILD SUCCESS")
        
        



if __name__ == "__main__":
    if os.path.basename(os.getcwd()) != "switch":
        print_error("You must run the build from the switch directory")
        exit(1)

    version = sys.argv[1]
    if version not in ["150", "160"]:
        print_error("Version is not valid. Use either \"150\" for 1.5.0 or \"160\" for 1.6.0")
        exit(1)
    rest_args = sys.argv[2:]
    relink = "-r" in rest_args or "--relink" in rest_args
    clean_linker = "-c" in rest_args or "--clean-linker" in rest_args
    local = "-l" in rest_args or "--local" in rest_args
    if local:
        BOTW_PATH = os.environ["BOTW_LOCAL"]

    VERBOSE = "--verbose" in rest_args
    
    

    builder = Build(version)
    returncode = builder.build(relink, clean_linker)
    exit(returncode)