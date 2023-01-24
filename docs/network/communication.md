---
layout: default
title: Communication
permalink: /network/communication
nav_order: 1
parent: Network
---

# Communication
The Switch Module and the Client communicates through your router. There is also a light weight internal Server in between to help relay the messages.

{: .warning }
The connection between the Switch and the Client is not secure. This is mostly fine in your local network. However you should avoid sending sensitive information with the application.

# The Switch
The Switch Module opens a TCP server on port 4000, which the internal server connects to. 

Since the Switch does not have a lot of processing power, and it has to run the game at the same time, it sends and receives data in raw bytes.

When the Switch receives a request, it unpacks and runs the request. The protocol used can be found in the [Protocol](./protocol) section.

# The Client
The Client is a React application packaged with ElectronJS. It produces a nice user interface for managing the tool.

The Client communicates with the internal server through WebSocket. The protocol is the same as the one for between Server and Switch.

# The Internal Server
The Internal Server is needed because React/browser applications cannot open raw TCP connections. It mainly relays the messages between the Client and the Switch. 

However, it also does basic error checking. If the opcode will be ignored by the Switch, it will not send the request, and it will send an error message to the Client to be displayed.

In debug builds, the server also sends debug messages to the client