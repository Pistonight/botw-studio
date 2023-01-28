import { LogFunction } from "data/log";
import { AppApi, ModuleId, Modules, Opcodes, Packet, PacketWriter, Unpacker } from "../type";

const NopPacker = () => true;
const ModulePacker: Record<ModuleId, (w: PacketWriter)=>boolean> = {
    [Modules.CookSpy]: NopPacker
}

export class ActivateModuleRequestPacket implements Packet {
    serial: number;
    module: ModuleId;
    activateData: Record<string, unknown>;
    constructor(serial: number, module: ModuleId, activateData: Record<string, unknown>) {
        this.serial = serial;
        this.module = module;
        this.activateData = activateData;
    }

    public execute({log}: AppApi) {
        log("D", "client", "Unexpected Activate Module Request");
    }

    public pack(w: PacketWriter, log: LogFunction) {
        if (!(this.module in ModulePacker)){
            log("E", "client", `Invalid module name: "${this.module}"`);
            return false;
        }
        w.writeInt16(Opcodes.ActivateModule);
        w.writeInt8(this.serial);
        w.writeInt16(this.module);

        ModulePacker[this.module](w);
        
        return true;
    }
}

export class ActivateModuleResponsePacket implements Packet {
    serial: number;
    remoteSessionId: number;
    constructor(serial: number, remoteSessionId: number) {
        this.serial = serial;
        this.remoteSessionId = remoteSessionId;
    }

    public execute({activateOutput}: AppApi) {
        activateOutput(this.serial, this.remoteSessionId);
    }

    public pack(_w: PacketWriter, log: LogFunction) {
        log("E", "client", "Unexpected Activate Module Response being sent");
        return false;
    }
}

export const ActivateModuleResponseUnpacker: Unpacker = (_opcode, r) => {
    const serial = r.readInt8();
    if(serial === undefined) {
        return undefined;
    }
    const remoteSessionId = r.readInt8();
    if(remoteSessionId === undefined) {
        return undefined;
    }
    return new ActivateModuleResponsePacket(serial, remoteSessionId);
}
