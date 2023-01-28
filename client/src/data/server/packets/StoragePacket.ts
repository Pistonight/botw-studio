import { LoggerLevel, LoggerSourceEnableMap } from "data/log";
import { AppApi, Opcodes, Packet, PacketWriter } from "../type";

export type PersistStorage = {
    consoles: Record<string, {
        name: string,
        level: LoggerLevel,
        enabled: LoggerSourceEnableMap
    }>,
    datas: Record<string, {
        name: string,
        obj: Record<string, unknown>
    }>,
    outputs: Record<string, {
        name: string
    }>,
    widgets: {
        theme: string|undefined,
        x: number,
        y: number,
        w: number,
        h: number,
        session: string
    }[]
}

export class PersistStoragePacket implements Packet {
    data: string;
    constructor(data: string) {
        this.data = data;
    }

    public execute({log}: AppApi) {
        log("D", "client", "Unexpected Storage Request");
    }

    public pack(w: PacketWriter) {
        w.writeInt16(Opcodes.StorageRequest);
        w.writeUri(this.data);
        return true;
    }
}