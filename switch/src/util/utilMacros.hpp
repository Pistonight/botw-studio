#pragma once

#include "utilVersion.hpp"

#define Ver160_Hash 1
#define Ver150_Hash 0x5b0ed718
#define IsVer160 (uks::util::GetRuntimeVersionHash() == Ver160_Hash)
#define IsVer150 (uks::util::GetRuntimeVersionHash() == Ver150_Hash)
#define VerString (IsVer160 ? "v1.6.0" : (IsVer150 ? "v1.5.0" : "Unknown Version"))



#define IF_FALSE_RETURN(expr) if (!(expr)) return
#define RANGE_AND_COUNT(array) (array), (sizeof(array) / sizeof((array)[0]))