import { saveSettingFromURIString } from "./setting";
import { WebSocket } from "ws";

const cleanAscii = (code: number): number => {
    if (code == 0xA || (code >= 0x20 && code <= 0x7E)) {
        return code;
    }
    return 0x3F; // "?"
}

const nullTerminatedAsciiFromString = (text: string): number[] => {
    const buffer: number[] = [];
    for(let i=0;i<text.length;i++){
        buffer.push(cleanAscii(text.charCodeAt(i)));
    }
    buffer.push(0);
    return buffer;
}

const serverMessage = (opcode: number, text: string): ArrayBuffer => {
    const textBytes = nullTerminatedAsciiFromString(text);
    const buffer = new ArrayBuffer(2+textBytes.length);
    const view = new DataView(buffer);
    view.setInt16(0, opcode, true /* littleEndian */);
    textBytes.forEach((b,i)=>{
        view.setInt8(2+i, b);
    });
    return view.buffer;
}

export const debugMessage = (text: string) => {
    return serverMessage(0x0000, text);
}

export const infoMessage = (text: string) => {
    return serverMessage(0x0100, text);
}

export const warnMessage = (text: string) => {
    return serverMessage(0x0200, text);
}

export const errorMessage = (text: string) => {
    return serverMessage(0x0300, text);
}

export enum DataAction {
    // Relay the message to Client or Switch
    Relay = 0,
    // Ignore the message
    Ignore = 1,
    // Handled the message
    Handled = 2
}

export const startFakeModule = (remoteSessionId: number, ws: WebSocket) => {
    let stopped = false;
    const update = () => {
        if(!stopped){
            const buffer = new ArrayBuffer(6);
            const returnView = new DataView(buffer);
            returnView.setInt16(0, 0x1202, true /* littleEndian */);
            returnView.setInt8(2, remoteSessionId);
            returnView.setInt16(3, 1 /* module id */, true /* littleEndian */);
            returnView.setInt8(5, Math.floor(Math.random() * 100));
            ws.send(buffer);
            setTimeout(update, 1000);
        }
    };
    setTimeout(update, 1000);
    const stop = () => {
        stopped = true;
    };
    return stop;
}

let stopFakeModule: (()=>void) | undefined = undefined;

export const onReceiveFromClient = (data: Uint8Array, ws: WebSocket): DataAction => {
    const view = new DataView(data.buffer);
    const opcode = view.getInt16(0, true /* littleEndian */);
    switch (opcode) {
        case 0x0001 /* Activate Module Request MOCK */: {
            const serial = view.getInt8(2);
            const buffer = new ArrayBuffer(4);
            const returnView = new DataView(buffer);
            returnView.setInt16(0, 0x0101, true /* littleEndian */);
            returnView.setInt8(2, serial);
            returnView.setInt8(3, 12);
            ws.send(buffer);
            stopFakeModule = startFakeModule(12, ws);
            return DataAction.Handled;
        }
        case 0x0002 /* Deactivate Module Request MOCK */: {
            stopFakeModule && stopFakeModule();
            ws.send(data);
            return DataAction.Handled;
        }
        case 0x0014 /* Storage Request */: {
            const bytes: number[] = [];
            let i = 0;
            while(true){
                const next = view.getInt8(i+2);
                if(next === 0){
                    break;
                }
                bytes.push(next);
                i++;
            }

            const str = String.fromCharCode(...(bytes.map(cleanAscii)));
            saveSettingFromURIString(str);
            return DataAction.Handled;
        }
            
    }

    return DataAction.Ignore;
}