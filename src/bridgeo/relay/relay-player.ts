import { RelayPlayer } from "bedrock-protocol";
import { PacketBufferParsed } from "protodef";

import CommonRelay from "@/bridgeo/relay/relay";
import { RelayContext } from "@/bridgeo/relay/starter";

// noinspection JSUnusedGlobalSymbols
export declare interface CommonRelayPlayer {
    server: CommonRelay;
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
    constructor(...args: unknown[]) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        super(...args);

        if (this.server.options.ignorePacketParseError) this.$hook$readUpstream$parsing_error = buffer => {
            this.sendBuffer(buffer);
            return true;
        };

        // TODO fix definitions
        // noinspection CommaExpressionJS
        this.$hook$readUpstream$parsed = (buffer, { data: { name } }) => (
            name === 'crafting_data'
            || name === 'spawn_particle_effect'
            || name === 'update_block_synced'
            || name === 'camera_instruction'
            || name === 'correct_player_move_prediction'
        ) && (this.sendBuffer(buffer), true);

        // if (this.server.options.reuseUnchangedBuffer) {
        //     const changed = new Map<Buffer, boolean>();
        //     const proxy = (id: Buffer, target: object) => new Proxy(target, handler(id));
        //     const handler: (_: Buffer) => ProxyHandler<object> = id => ({
        //         get(...args) {
        //             const value = Reflect.get(...args);
        //             if (value === null) return value;
        //             return typeof value === 'object' ? new Proxy(value, handler(id)) : value;
        //         },
        //         set(...args) {
        //             const value = Reflect.set(...args);
        //             changed.set(id, true);
        //             return value;
        //         },
        //     });
        //     const $hook$readUpstream$parsed_last = this.$hook$readUpstream$parsed;
        //     this.$hook$readUpstream$parsed = (buffer, parsed) => $hook$readUpstream$parsed_last(buffer, parsed) ? true : void (parsed.data = proxy(buffer, parsed.data));
        //     // noinspection CommaExpressionJS
        //     this.$hook$readUpstream$emitted = buffer => !changed.get(buffer) && (this.sendBuffer(buffer), true);
        // }
    }
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
