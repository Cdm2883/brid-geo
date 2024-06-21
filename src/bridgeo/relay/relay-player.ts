import { RelayPlayer } from "bedrock-protocol";
import { PacketBufferParsed } from "protodef";

import { RelayContext } from "@/bridgeo/relay/starter";

// noinspection JSUnusedGlobalSymbols
export declare interface CommonRelayPlayer {
    on(event: 'loggingIn', listener: (body: unknown) => void): this;
    on(event: 'server.client_handshake', listener: (callback: { key: unknown }) => void): this;
    on(event: 'login', listener: (callback: { user: unknown }) => void): this;
    on(event: 'join', cb: () => void): this;
    on(event: 'close', cb: (reason: string) => void): this;
    on(event: 'spawn', cb: (reason: string) => void): this;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on(event: 'clientbound', listener: (packet: any, options: PacketBufferParsed<any> & { canceled: boolean }) => void): this;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on(event: 'serverbound', listener: (packet: any, options: PacketBufferParsed<any> & { canceled: boolean }) => void): this;

    on(event: 'upstream', listener: (buffer: Buffer, options: { canceled: boolean }) => void): this;
    on(event: 'downstream', listener: (buffer: Buffer, options: { canceled: boolean }) => void): this;
}
export class CommonRelayPlayer extends RelayPlayer {
    context!: RelayContext;
    readUpstream(packet: Buffer) {
        const options = { canceled: false };
        this.emit('upstream', packet, options);
        if (options.canceled) return;
        super.readUpstream(packet);
    }
    readPacket(packet: Buffer) {
        const options = { canceled: false };
        this.emit('downstream', packet);
        if (options.canceled) return;
        super.readPacket(packet);
    }
}
export default CommonRelayPlayer;
