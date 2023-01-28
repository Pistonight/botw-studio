import ShortUniqueId from "short-unique-id";

const SessionUid = new ShortUniqueId({length: 10});

export const getUniqueSessionId = (): string => SessionUid();

let serial = 0;
export const getNextSerialId = () => {
    serial++;
    if (serial > 127) {
        serial = 0;
    }
    return serial;
}