---
layout: default
title: Cook Spy
permalink: /modules/cookspy
nav_order: 2
parent: Modules
---

# Cook Spy
Cook Spy is a module that collects information when you use the cooking pot.

## Miminal Configuration
To use this module, specify `Module: "CookSpy"` in the configuration.
```js
{
    "Module": "CookSpy"          // Name of the module to use
}
```

## Full Configuration
```js
{
    "Module": "CookSpy"          // Name of the module to use
    "Output": "CookSpy"          // Where to output
}
```

## Module Arguments
### Activate
This module takes no additional arguments to activate

### Get Data
This module takes no additional arguments to get data from

### Receive Data
```
C
C = critical chance as number between 0 and 100, inclusive. 1 byte
```
