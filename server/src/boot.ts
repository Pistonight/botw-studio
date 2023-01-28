import http from "http";
import path from "path";
import handler from "serve-handler";
import { WebSocketServer } from "ws";
import { infoMessage, debugMessage, onReceiveFromClient } from "./data";

import { localhostUrl } from "./util";

export type Args = {
    clientPort: number,
    webSocketPort: number
}

export const parseArgs = (args: string[]): Args => {
    const output = {
        clientPort: 3000,
        webSocketPort: 8001
    };
    const ClientPortArg = "--client-port=";
    const WebSocketPortArg = "--web-socket-port="

    args.forEach(arg=>{
        if (arg.startsWith(ClientPortArg)) {
            output.clientPort = parseInt(arg.substring(ClientPortArg.length));
        }else if (arg.startsWith(WebSocketPortArg)) {
            output.webSocketPort = parseInt(arg.substring(WebSocketPortArg.length));
        }
    });

    return output;
}

export const serveClient = (port: number): (()=>void) => {
    const server = http.createServer((request, response) => {
        //request.url = path.join(__dirname, "../client/", request.url ?? "/")
        return handler(request, response, {
            public: path.join(__dirname, "../client")
        });
    });
      
    server.listen(port, () => {
        console.log(`Serving client at ${localhostUrl(port)}`);
    });

    return () => server.close();
}

export const openWebSocketServer = (port: number) : (()=>void) => {
    const wss = new WebSocketServer({ port });

    wss.on('connection', function connection(ws) {
        ws.on('message', function message(data) {
            const buffer = new Uint8Array(data as Buffer);
            ws.send(debugMessage("Message received."))
            onReceiveFromClient(buffer, ws);
        });
    
    });

    return () => wss.close();
}



