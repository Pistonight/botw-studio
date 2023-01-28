---
layout: default
title: Protocol
permalink: /network/protocol
nav_order: 1
parent: Network
---

# Protocol
This is the protocol used for transimitting data in the application.

## Switch-Server Packet
Each request is packaged into a variable-size Packet with the following layout. Each letter represents a byte. All multi-byte numeric fields are little endian
```
LL OO MMMMMMM ...
L = Length of the packet, in bytes
O = Opcode
M = Rest of the message
```

## Client-Server Packet
The packets sent between client and server are the same as Switch-Server packets, except it does not have the 2-byte length field. Since we are using the WebSocket protocol, it's ok to send data without specifying length ourselves.

## Unexpected/Unknown Packets
Some packets are expected to be received by both the Switch and the Client, while others are only expected by one side. 

- If the Switch receives an unexpect packet, or a packet with an unknown opcode, it will simply ignore it for better network performance.
- If the Client receives one, it will log an error message.

For the packets below, if the behavior is not listed for a side, it's not expected to be received by that side.

## Opcodes
The Opcode of a Packet defines what the request is.

{: .note }
If a Packet will be ignored when received on the Switch, the Server will not send it

---

### `0xXX00` Message Request
Sending raw messages. 

#### Variants
- `0x0000` Debug Message
- `0x0100` Info Message
- `0x0200` Warn Message
- `0x0300` Error Message
- `0x1000` Switch Debug Message
- `0x1100` Switch Info Message
- `0x1200` Switch Warn Message
- `0x1300` Switch Error Message

#### Arguments
The rest of the message is an ascii-encoded string.

{: .note }
All strings received by the Switch are ascii-encoded. However, the Client uses UTF-8 strings. If the character is not ascii, it will be replaced by `?`

#### Behavior
- Client: Log in console

---

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
  - If the Switch is at its maximum number of opened sessions. A `0x1300` Switch Error Message will be sent instead

---

### `0x0101` Activate Module Response
This message is sent by the Switch as a reponse to Activate Module Request. It contains the session id that is opened and the same serial id sent with the request.

#### Arguments
```
S B
S = Serial ID. 1 byte. Same as the one in the Request
B = Session ID. 1 byte
```

#### Behavior
- Received by Client:
  - Opens a Widget that connects to the module output and caches the returned session ID

---

### `0x0002` Deactivate Module Request/Response
Request to deactivate the module.

Client sends this request to the Switch to close a session and deactivate a module. The Switch will deactivate the session but not free it so it doesn't allocate a new session before the Client can clean it up.

`0xXX02` opcodes all have session id as the first argument.

#### Arguments
```
S
S = Session ID
```

#### Behavior
- Received by Switch: Deactivate the session, and send `0x0002` Deactivate Module Request back to the Client with same session ID
- Received by Client: Close resources used by the session, and sends `0x0102` Free Session Request to finally delete the session

### `0x0102` Free Session Request
Request to free a Session, so the slot can be used by another Session later.

If the Session to be freed is not deactivated, it's automatically deactivated.

#### Arguments
```
S
S = Session ID
```
#### Behavior
- Received by Switch: free the session, deactivate the module if needed

---

### `0x0202` Get Data Request
This request is used to get data from a module.

#### Arguments
```
S AAAAAAAA ....
S = Session ID
A = Module-specific data. Maybe empty
```

#### Behavior
- Received by Switch:
  - Returns `0x1202` Module Data for valid sessions
  - For invalid sessions, return `0x1300` Switch Error Message

---

### `0x1202` Module Data
The packed data of a module

#### Arguments
```
S MM DDDDD ...
S = Session ID
M = Module ID
D = Module-specific data
```

#### Behavior
- Received by Client: Display the data in the corresponding output Widget

---

### `0x0003` Disconnect Request
This request is sent to the Switch to disconnect the Client.

No response is sent. The Client will automatically disconnect when the connection is lost.

No arguments is needed for this opcode. The switch will close all sessions and modules before closing the connection, and no new sessions can be made.

## Client-Server Special Requests
There are special requests that client sends to the server for additional functionality

### `0x0014` Storage Request
Client send this request to the server to persist settings.

#### Arguments
```
JJJJJJJJJ ...
J = Null-terminated, URI-encoded JSON string
```

#### Behavior
Received by Server: Persist the JSON object

### `0x0005` Connection Request/Response
Request the internal Server to connect to the Switch

#### Arguments
```
JJJJJJJJJ ...
J = Null-terminated, URI-encoded JSON string with SwitchHost, SwitchPort and Connected
```

#### Behavior
Received by Server: attempt to connect with the Switch if not already connected. Send response to client to update the connection data
Received by Client: Update the connection data
