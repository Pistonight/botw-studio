# Makefile for the main nso and npdm

ifeq ($(strip $(DEVKITPRO)),)
$(error "Please set DEVKITPRO in your environment. export DEVKITPRO=<path to>/devkitpro")
endif

include $(DEVKITPRO)/libnx/switch_rules

#---------------------------------------------------------------------------------
# Variables

# Target name
TARGET          := botw-gametools
PROGRAM_ID		:= 01007ef00011e000

# DIRECTORIES
# Build Output (This mk file operates inside the build folder)
BUILD_DIR 		:= .
# Root Directory
ROOT_DIR        := ..
# Dependencies
LIB_DIR         := $(ROOT_DIR)/libs
# Config files (files that are not sources)
CONFIG_DIR		:= $(ROOT_DIR)/config
# Application Sources
SOURCE_DIR      := $(ROOT_DIR)/src
# Exlaunch source
EXLAUNCH_SRC	:=  $(LIB_DIR)/exlaunch/source

# Scan for nested source directories. We need to compile exlaunch and our application code
ALL_SOURCES_DIRS	:= 	$(shell find $(SOURCE_DIR) -type d) $(shell find $(EXLAUNCH_SRC) -type d)
# Library paths
LIBDIRS :=  $(PORTLIBS) $(LIBNX)
# Include paths
ALL_INCLUDE_DIRS	:=	\
$(SOURCE_DIR) \
$(EXLAUNCH_SRC) \
$(EXLAUNCH_SRC)/lib \
$(LIB_DIR)/nnheaders/include \
$(LIB_DIR)/sead/include

# VPATH for make to search for files
VPATH	:=	$(foreach dir,$(ALL_SOURCES_DIRS),$(CURDIR)/$(dir))

# INPUT FILES
# (Generated) Linker script for statically linking symbols.
LDSCRIPT    := $(BUILD_DIR)/syms.ld
# Linker version script
LINKER_VERSION_SCRIPT := $(CONFIG_DIR)/version_script.txt
# Source files 
CFILES		:=	$(foreach dir,$(ALL_SOURCES_DIRS),$(notdir $(wildcard $(dir)/*.c)))
CPPFILES	:=	$(foreach dir,$(ALL_SOURCES_DIRS),$(notdir $(wildcard $(dir)/*.cpp)))
SFILES		:=	$(foreach dir,$(ALL_SOURCES_DIRS),$(notdir $(wildcard $(dir)/*.s)))

# OUTPUT FILES
# .specs file for linking. This one is copied from exlaunch and modified to include syms.ld
SWITCH_SPECS := $(CONFIG_DIR)/module.specs
# .o files
OFILES	 :=	$(CPPFILES:.cpp=.o) $(CFILES:.c=.o) $(SFILES:.s=.o)
# .d files 
DFILES	 :=	$(OFILES:.o=.d)
# Application json for generating npdm
APP_JSON := $(CONFIG_DIR)/app.json

# CODE GEN OPTIONS
# Use CXX for linking
LD	    := $(CXX)
# Include path
INCLUDE	:=	\
$(foreach dir,$(ALL_INCLUDE_DIRS),-I$(CURDIR)/$(dir)) \
$(foreach dir,$(LIBDIRS),-I$(dir)/include)
# Defines
DEFINES := -D__SWITCH__ -DSWITCH -DNNSDK -DEXL_LOAD_KIND=Module -DEXL_LOAD_KIND_ENUM=2 -DEXL_PROGRAM_ID=0x$(PROGRAM_ID)
# Architecture
ARCH	:= -march=armv8-a -mtune=cortex-a57 -mtp=soft -fPIC -ftls-model=local-exec
# C flags
CFLAGS	:= -g -Wall -ffunction-sections -O3 $(ARCH) $(DEFINES) $(INCLUDE) 
# CXX flags
CXXFLAGS	:= $(CFLAGS) -fno-rtti -fomit-frame-pointer -fno-exceptions -fno-asynchronous-unwind-tables -fno-unwind-tables -enable-libstdcxx-allocator=new -fpermissive -std=gnu++2b
# AS flags
ASFLAGS	    := -g $(ARCH)
# LD flags
LDFLAGS     := -specs=$(SWITCH_SPECS) -g $(ARCH) -Wl,-Map,$(TARGET).map -Wl,--version-script=$(LINKER_VERSION_SCRIPT) -nodefaultlibs
# LD libs
LIBS	    := -lgcc -lstdc++ -u malloc
# LD lib paths
LIBPATHS	:= $(foreach dir,$(LIBDIRS),-L$(dir)/lib)
# DEPSDIR used by DEVKITPRO for exporting .d files
DEPSDIR	    ?= .

#---------------------------------------------------------------------------------
# Make Targets
.PHONY:	all
all: $(TARGET).nso $(TARGET).npdm

# Make target ELF depend on all .o files
$(TARGET).elf   : $(OFILES) $(SWITCH_SPECS)

# Not sure why the default npdm rule fails. Redefining the rule here.
# The tool prints error message for missing fields in json. They are not important so we ignore the errors
$(TARGET).npdm: $(APP_JSON)
	npdmtool $(APP_JSON) $@ 2> /dev/null
# The rest of the build rules are specified by the devkitpro makefile

# Include the .d files generated
-include $(DFILES)
