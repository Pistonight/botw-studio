import { LogFunction } from "data/log";
import { AppApi, ModuleId, Modules, Packet, PacketReader, PacketWriter, Unpacker } from "../type";

const ModuleUnPacker: Record<ModuleId, (r: PacketReader)=>(Record<string, unknown>|undefined)> = {
    [Modules.CookSpy]: (r) => {
        const critChance = r.readInt8();
        if(critChance === undefined) {
            return undefined;
        }
        return {
            "CritChance": critChance
        };
    }
}

export class ModuleDataPacket implements Packet {
    remoteSessionId: number;
    data: Record<string, unknown>;
    constructor(remoteSessionId: number, data: Record<string, unknown>) {
        this.remoteSessionId = remoteSessionId;
        this.data = data;
    }

    public execute({updateOutput}: AppApi) {
        updateOutput(this.remoteSessionId, this.data);
    }

    public pack(_w: PacketWriter, log: LogFunction) {
        log("E", "client", "Unexpected Module Data being sent");
        return false;
    }
}

export const ModuleDataUnpacker: Unpacker = (_opcode, r) => {
    const remoteSessionId = r.readInt8();
    if(remoteSessionId === undefined) {
        return undefined;
    }
    const moduleId = r.readInt16();
    if(moduleId === undefined) {
        return undefined;
    }
    if(!(moduleId in ModuleUnPacker)){
        return undefined;
    }
    const data = ModuleUnPacker[moduleId as ModuleId](r);
    if(!data){
        return undefined;
    }
    return new ModuleDataPacket(remoteSessionId, data);
}