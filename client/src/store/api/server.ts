import { AppApi, FreeSessionPacket, pack, Packet, unpack } from "data/server";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SessionApi } from "./session";
import QueryString from "query-string";

const createStub = () => ({
    isStub: true,
    send: () => {/* Stub */},
    close: () => {/* Stub */},
});

type Stub = ReturnType<typeof createStub>;

const isStub = (ws: WebSocket|Stub): ws is Stub => "isStub" in ws;

export const useServerApi = ({
    log,
    activateOutput,
    deactivateOutput,
    updateOutput
}: SessionApi) => {
    const [serverReady, setReady] = useState<boolean>(false);
    const [ws, setWebSocket] = useState<WebSocket|Stub>(createStub);

    const sendPacket = useCallback((packet: Packet) => {
        if(isStub(ws)){
            log("E", "client", "Cannot send packet: WebSocket not ready");
            return;
        }
        const data = pack(packet, log);
        if(!data){
            log("E", "client", "Packet validation failed!");
            return;
        }
        ws.send(data);
    }, [ws, log]);

    const appApi: AppApi = useMemo(()=>({
        log,
        activateOutput,
        deactivateOutput: (remoteSessionId: number) => {
            deactivateOutput(remoteSessionId);
            log("I", "client", `Freeing remote session ${remoteSessionId}...`)
            sendPacket(new FreeSessionPacket(remoteSessionId));
        },
        updateOutput
    }), [
        log,
        activateOutput,
        deactivateOutput,
        updateOutput
    ]);

    const onWsOpen = useCallback(()=>{
        log("I", "client", "Internal server connected!");
        setReady(true);
    }, [log]);

    const onWsError = useCallback(()=>{
        log("E", "client", "WebSocket error!");
        ws.close();
    }, [ws, log]);

    const onWsClose = useCallback(()=>{
        log("I", "client", "Disconnected from internal server. Will reconnect in 5 seconds...");
        setReady(false);
        setTimeout(()=>{
            setWebSocket(createStub());
        }, 5000);
    }, [ws, log]);

    const onWsMessage = useCallback(async (e: MessageEvent) => {
        const blob = e.data as Blob;
        if(!blob) {
            log("E", "client", "Received invalid message!");
        }
        const buffer = new Uint8Array(await blob.arrayBuffer());
        const packet = unpack(buffer);
        packet.execute(appApi);
    }, [log, appApi]);

    useEffect(()=>{
        if (isStub(ws)) {
            const query = QueryString.parse(window.location.search);
            const port = query.port ?? 8001;
            // create new web socket
            const addr = `ws://localhost:${port}`;
            log("I", "client", `Connecting to internal server at ${addr}`);
            const newWebSocket = new WebSocket(addr);
            newWebSocket.onopen = onWsOpen;
            newWebSocket.onerror = onWsError;
            newWebSocket.onclose = onWsClose;
            newWebSocket.onmessage = onWsMessage;
            setWebSocket(newWebSocket);
        }else{
            ws.onopen = onWsOpen;
            ws.onerror = onWsError;
            ws.onclose = onWsClose;
            ws.onmessage = onWsMessage;
        }
    }, [
        ws,
        onWsOpen,
        onWsError,
        onWsClose,
        onWsMessage
    ]);

    return useMemo(()=>({
        sendPacket,
        serverReady: serverReady && !isStub(ws)
    }),[
        sendPacket,
        serverReady,
        ws
    ]);
}

export type ServerApi = Readonly<ReturnType<typeof useServerApi>>;