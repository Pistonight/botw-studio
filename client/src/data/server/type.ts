import { LogFunction } from "data/log"

// Please update docs/network/protocol.md if opcodes are modified
export const Opcodes = {
    // Message Request
    DebugMessage: 0x0000,
    InfoMessage: 0x0100,
    WarnMessage: 0x0200,
    ErrorMessage: 0x0300,
    SwitchDebugMessage: 0x1000,
    SwitchInfoMessage: 0x1100,
    SwitchWarnMessage: 0x1200,
    SwitchErrorMessage: 0x1300,

    // Module Request
    ActivateModule: 0x0001,
    ActivateModuleResponse: 0x0101,
    DeactivateModule: 0x0002,
    FreeSession: 0x0102,

    ModuleData: 0x1202,

    // Storage Request
    StorageRequest: 0x0014
} as const;

export type Opcode = (typeof Opcodes)[keyof typeof Opcodes];

export const Modules = {
    CookSpy: 1
} as const;

export type ModuleId = (typeof Modules)[keyof typeof Modules];

// Reading packet data. Returns undefined on failure
export interface PacketReader {
    readInt8(): number | undefined,
    readInt16(): number | undefined,
    // Read Null-terminated ascii string. Unreadable characters are replaced with "?"
    readAscii(): string | undefined,
    // Read ascii string then URI-decode it
    readUri(): string | undefined
}

// Writing packet data
export interface PacketWriter {
    writeInt8(n: number): void,
    writeInt16(n: number): void,
    // Write ascii string and a null byte. Non-ascii and unreadable characters are replaced with "?"
    writeAscii(text: string): void,
    // URI-encode the string then write it
    writeUri(text: string): void,
    done(): Uint8Array
}

export interface Packet {
    // Execute the packet
    execute: (api: AppApi) => void
    // Pack the packet into the data, return if the pack is successful
    pack: (w: PacketWriter, log: LogFunction) => boolean
    
}

export type Unpacker = (opcode: Opcode, r: PacketReader) => Packet | undefined;


// The Api for data layer to connect with application
export type AppApi = {
    // Logging a message
    log: LogFunction,
    // Connect to output
    activateOutput: (serialId: number, remoteSessionId: number) => void,
    // Disconnect from output
    deactivateOutput: (remoteSessionId: number) => void,
    // Update the output
    updateOutput: (remoteSessionId: number, data: Record<string, unknown>) => void,
}