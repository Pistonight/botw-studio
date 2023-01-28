import { AppApi, Opcodes, Packet, PacketWriter } from "../type";

export class FreeSessionPacket implements Packet {
    remoteSessionId: number;
    constructor(remoteSessionId: number) {
        this.remoteSessionId = remoteSessionId;
    }

    public execute({log}: AppApi) {
        log("D", "client", "Unexpected Free Session Request");
    }

    public pack(w: PacketWriter) {
        w.writeInt16(Opcodes.FreeSession);
        w.writeInt8(this.remoteSessionId);
        return true;
    }
}