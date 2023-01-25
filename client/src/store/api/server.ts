import { pack, Packet, unpack } from "data/server";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SessionApi } from "./session";
import QueryString from "query-string";

export const useServerApi = ({
    log
}: SessionApi) => {
    const [ws, setWebSocket] = useState<WebSocket|null>(null);

    const sendPacket = useCallback((packet: Packet) => {
        if(!ws){
            log("E", "client", "Cannot send packet: WebSocket not ready");
            return;
        }
        log("I", "client", `Sending ${packet.type}`);
        const data = pack(packet);
        ws.send(data);
    }, [ws, log]);

    const createWebSocket = useCallback(() => {
        const query = QueryString.parse(window.location.search);
        const port = query.port ?? 8001;
        // create new web socket
        const addr = `ws://localhost:${port}`;
        log("I", "client", `Connecting to internal server at ${addr}`);
        const newWebSocket = new WebSocket(addr);
        newWebSocket.onopen = () => {
            log("I", "client", "Internal server connected!");
        };
        newWebSocket.onerror = (e) => {
            log("E", "client", "WebSocket error!");
            newWebSocket.close();
        };
        newWebSocket.onclose = () => {
            log("I", "client", "Disconnected from internal server. Will reconnect in 5 seconds...");
            if (ws){
                setTimeout(()=>{
                    setWebSocket(null);
                }, 5000);
            }else{
                setTimeout(()=>{
                    createWebSocket();
                }, 5000);
            }
        };
        newWebSocket.onmessage = async (e) => {
            const blob = e.data as Blob;
            if(!blob) {
                log("E", "client", "Received invalid message!");
            }
            const buffer = new Uint8Array(await blob.arrayBuffer());
            const packet = unpack(buffer);
            log("I", "client", `Received ${JSON.stringify(packet)}`);
        };
        return newWebSocket;
    }, [ws, log])

    useEffect(()=>{
        if (!ws) {
            setWebSocket(createWebSocket());
        }
    }, [ws, createWebSocket]);

    return useMemo(()=>({
        sendPacket
    }),[
        sendPacket
    ]);
}