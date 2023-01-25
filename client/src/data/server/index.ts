import { Packet } from "./type";

export * from "./type";

// place holder api
export const pack = (packet: Packet): Uint8Array => {
    return new Uint8Array();
}

export const unpack = (buffer: Uint8Array): Packet => {
    return {type: "unknown"};
}