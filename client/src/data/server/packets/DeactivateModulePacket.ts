import { AppApi, Opcodes, Packet, PacketWriter, Unpacker } from "../type";

export class DeactivateModulePacket implements Packet {
    remoteSessionId: number;
    constructor(remoteSessionId: number) {
        this.remoteSessionId = remoteSessionId;
    }

    public execute({deactivateOutput}: AppApi) {
        deactivateOutput(this.remoteSessionId);
    }

    public pack(w: PacketWriter) {
        w.writeInt16(Opcodes.DeactivateModule);
        w.writeInt8(this.remoteSessionId);
        return true;
    }
}

export const DeactivateModuleUnpacker: Unpacker = (_opcode, r) => {
    const remoteSessionId = r.readInt8();
    if(remoteSessionId === undefined) {
        return undefined;
    }
    return new DeactivateModulePacket(remoteSessionId);
}