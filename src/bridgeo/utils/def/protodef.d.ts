declare module 'protodef' {
    import * as Buffer from "node:buffer";

    interface PacketBufferParsed<T> {
        data: T;
        metadata: {
            size: number;
        };
        buffer: Buffer;
        fullBuffer: Buffer;
    }
}
