#pragma once

#define IF_FALSE_RETURN(expr) if (!(expr)) return
#define RANGE_AND_COUNT(array) (array), (sizeof(array) / sizeof((array)[0]))