import { LoggerLevel, LoggerSource } from "data/log"
import { AppApi, Packet, PacketWriter, Unpacker } from "../type"

const OpcodeMap = {
    "D": 0x0000,
    "I": 0x0100,
    "W": 0x0200,
    "E": 0x0300,
    "client": 0,
    "server": 0,
    "switch": 0x1000
} as const;

export class MessagePacket implements Packet {
    source: LoggerSource;
    level: LoggerLevel;
    message: string;
    constructor(source: LoggerSource, level: LoggerLevel, message: string) {
        this.source = source;
        this.level = level;
        this.message = message;
    }

    public execute({log}: AppApi) {
        log(this.level, this.source, this.message);
    }

    public pack(w: PacketWriter) {
        const opcode = OpcodeMap[this.source] | OpcodeMap[this.level];
        w.writeInt16(opcode);
        w.writeAscii(this.message)
    }
}

export const MessagePacketUnpacker: Unpacker = (opcode, r) => {
    // When unpacking at client, it cannot be from client itself
    const sourceCode = opcode & OpcodeMap["switch"];
    const source = sourceCode !== 0 ? "switch" : "server";
    const levelCode = opcode - sourceCode;
    let level: LoggerLevel = "D";
    switch (levelCode) {
        case OpcodeMap.I:
            level = "I";
            break;
        case OpcodeMap.W:
            level = "W";
            break;
        case OpcodeMap.E:
            level = "E";
            break;
    }
    const message = r.readAscii();
    if(message === undefined){
        return undefined;
    }
    return new MessagePacket(source, level, message);
}