import { MessagePacket, MessagePacketUnpacker } from "./packets";
import { Opcode, Packet, PacketReader, PacketWriter, Unpacker } from "./type";

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

const asciiFromBytes = (bytes: number[]): string => {
    return String.fromCharCode(...bytes.map(cleanAscii));
}

// An auto-expanding wrapper of ArrayBuffer for writing data
class PacketWriterImpl implements PacketWriter {
    buffer: ArrayBuffer;
    offset: number;
    view: DataView;

    constructor(capacity = 8) {
        this.buffer = new ArrayBuffer(capacity);
        this.offset = 0;
        this.view = new DataView(this.buffer);
    }

    private ensureCapacity(need: number) {
        if (this.offset + need > this.buffer.byteLength) {
            const newCapacity = Math.max(this.offset + need, this.buffer.byteLength * 2);
            const newView = new Uint8Array(new ArrayBuffer(newCapacity));
            newView.set(new Uint8Array(this.buffer));
            this.buffer = newView.buffer;
            this.view = new DataView(this.buffer);
        }
    }

    public done(): Uint8Array {
        // console.log(this.offset);
        // const returnValue = 
        // returnValue.set(new Uint8Array(this.buffer));
        return new Uint8Array(this.buffer).subarray(0, this.offset);
    }

    writeInt8(n: number): void {
        this.ensureCapacity(1);
        this.view.setInt8(this.offset, n);
        this.offset += 1;
    }
    writeInt16(n: number): void {
        this.ensureCapacity(2);
        this.view.setInt16(this.offset, n, true /* littleEndian */);
        this.offset += 2;
    }
    writeAscii(text: string): void {
        const bytes = nullTerminatedAsciiFromString(text);
        bytes.forEach(n=>this.writeInt8(n));
    }
    writeUri(text: string): void {
        this.writeAscii(encodeURIComponent(text));
    }
}

class PacketReaderImpl implements PacketReader{
    length: number;
    offset: number;
    view: DataView;
    constructor(buffer: ArrayBuffer) {
        this.length = buffer.byteLength;
        this.offset = 0;
        this.view = new DataView(buffer);
    }

    private hasNBytes(n: number): boolean {
        return this.offset + n <= this.length;
    }

    public readInt8(): number | undefined {
        if(!this.hasNBytes(1)){
            return undefined;
        }
        const value = this.view.getInt8(this.offset);
        this.offset += 1;
        return value;
    }

    public readInt16(): number | undefined {
        if(!this.hasNBytes(2)){
            return undefined;
        }
        const value = this.view.getInt16(this.offset, true /* littleEndian */);
        this.offset += 2;
        return value;
    }

    public readAscii(): string | undefined {
        const bytes: number[] = [];
        
        while(true) { // eslint-disable-line no-constant-condition
            const next = this.readInt8();
            if(next === undefined){
                return undefined;
            }
            if(next === 0){
                break;
            }
            bytes.push(next);
        }

        return asciiFromBytes(bytes);
    }

    public readUri(): string | undefined {
        const str = this.readAscii();
        if(str === undefined){
            return str;
        }
        return decodeURIComponent(str);
    }

}

export const pack = (packet: Packet): ArrayBuffer => {
    const writer = new PacketWriterImpl();
    packet.pack(writer);
    return writer.done();
}

const UnpackerRegistry: Record<number, Unpacker> = {
    0x0000: MessagePacketUnpacker,
    0x0100: MessagePacketUnpacker,
    0x0200: MessagePacketUnpacker,
    0x0300: MessagePacketUnpacker,
    0x1000: MessagePacketUnpacker,
    0x1100: MessagePacketUnpacker,
    0x1200: MessagePacketUnpacker,
    0x1300: MessagePacketUnpacker
}

const createErrorPacket = (message: string): Packet => {
    return new MessagePacket("client", "E", "IO Error: "+message);
}

export const unpack = (buffer: Uint8Array): Packet => {
    const reader = new PacketReaderImpl(buffer.buffer);
    const opcode = reader.readInt16();
    if(opcode === undefined){
        return createErrorPacket("Cannot read opcode");
    }
    const unpacker = UnpackerRegistry[opcode];
    if (!unpacker) {
        return createErrorPacket(`Invalid opcode 0x${opcode.toString(16)}`);
    }
    const packet = unpacker(opcode as Opcode, reader);
    if (packet === undefined) {
        return createErrorPacket("Error reading packet");
    }
    return packet;

}