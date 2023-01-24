---
layout: default
title: Protocol
permalink: /network/protocol
nav_order: 1
parent: Network
---

# Protocol
This is the protocol used for transimitting data in the application.

## Packet
Each request is packaged into a variable-size Packet with the following layout. Each letter represents a byte
```
LL OO MMMMMMM ...
L = Length of the packet, in bytes
O = Opcode
M = Rest of the message
```

## Opcodes
The Opcode of a Packet defines what the request is.

{: .note }
If a Packet will be ignored when received on the Switch, the Server will not send it

### `0xXX00` Message Request
Sending raw messages. 

#### Variants
- `0x0000` Debug Message
- `0x0100` Info Message
- `0x0200` Warn Message
- `0x0300` Error Message

#### Arguments
The rest of the message is an ascii-encoded string.

{: .note }
All strings received by the Switch are ascii-encoded. However, the Client uses UTF-8 strings. If the character is not ascii, it will be replaced by `?`

#### Behavior
- Received by Switch: Ignored
- Received by Client: Log in console

### `0x0001` Activate Module Request
Activate a new instance of a module and creates a session.

`0xXX01` opcodes all have a 1-byte serial id as the first argument for tracking.

#### Arguments

{: .note }
The layout shown are after length and opcode

```
S MM AAAAAAA ...
S = Serial ID. 1 byte
M = Module ID.
A = Module-specific arguments
```

#### Behavior
- Received by Switch:
  - Create a new session with the module and respond with `0x0101` Activate Module Response with the same serial ID and the new session ID.
  - If the Switch is at its maximum number of opened sessions. A `0x0300` Error Message will be sent instead
- Received by Client: Unexpected

{: .note }
If the Client receives an unexpected message, the default behavior is logging it as a warning in the console



Opcode 0101: Activate Module Response
Fields: serial (1 byte), session id (1 byte)
Received by Switch: Ignore
Received by Client: connect the session id to output widget, etc

Opcode 0003: Deactivate Module Request/Response
Fields: session id (1 byte)
Received by Switch: close up the module but not free the session yet
Received by Client: clean up session and send free session request

Opcode 0103: Free Session Request
Fields: session id (1 byte)
Received by Switch: free the session slot
Received by Client: Log Error

Opcode 0203: Get Module Data Request
Fields: session id (1 byte)
Received by Switch: Pack the data and send back
Received by Client: Log Error

Opcode 1203: Module Data
Fields: session id (1 byte), module data pack
Received by Switch: Ignore
Received by Client: Update view

Opcode 2203: Execute Command Request
Fields: session_id (1 byte), command data pack
Received by Switch: execute the command
Received by Client: Log Error

Opcode 0004: Heartbeat
Received by Switch: send heartbeat back
Received by Client: ignore


Opcode 00FF: Disconnect Request/Response
Fields: none
Received by Switch: Closes all sessions and disconnect
Received by Client: Closes all sessions and widgets