// noinspection JSUnusedGlobalSymbols

import * as Buffer from "node:buffer";
import EventEmitter from "node:events";

import { ServerDeviceCodeResponse } from "prismarine-auth";
import { PacketBufferParsed } from "protodef";

declare module 'bedrock-protocol' {

    export interface Connection extends EventEmitter {
        sendQ: Buffer[];
        sendIds: string[];
    }

    export interface Client extends Connection {
        options: ClientOptions;
        conLog?: (...messages: unknown[]) => void;
        disconnect(reason?: string, hide?: boolean): void;
        close(): void;
    }

    export interface Player extends Connection {
        server: Server;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        connection: any;
        readPacket(packet: Buffer);
        on(event: 'loggingIn', listener: (body) => void): this;
        on(event: 'server.client_handshake', listener: ({ key }) => void): this;
        on(event: 'login', listener: ({ user }) => void): this;
        on(event: 'join', cb: () => void): this;
        on(event: 'close', cb: (reason: string) => void): this;
        on(event: 'packet', cb: (packet: object) => void): this;
        on(event: 'spawn', cb: (reason: string) => void): this;
    }
    export interface Server {
        options: ServerOptions;
        clients: Record<string, Player>;
        clientCount: number;
    }

    export interface RelayOptions extends ServerOptions {
        logging?: boolean;
        offline?: false;
        authTitle?: string;
        destination: {
            realms?: RealmsOptions;
            host: string;
            port: number;
            offline?: boolean;
        };
        enableChunkCaching?: boolean;
        forceSingle?: boolean;
        omitParseErrors?: boolean;
        onMsaCode?(data: ServerDeviceCodeResponse, client: Client): unknown;
        flow?: string;
        deviceType?: string;

        relayPlayer?: typeof RelayPlayer;
    }
    export class RelayPlayer extends Player {
        server: Relay;
        downQ: Buffer[];
        upQ: Buffer[];
        new (server: Relay, conn);
        readUpstream(packet: Buffer);
        flushDownQueue();
        flushUpQueue();
        on(event: 'loggingIn', listener: (body) => void): this;
        on(event: 'server.client_handshake', listener: ({ key }) => void): this;
        on(event: 'login', listener: ({ user }) => void): this;
        on(event: 'join', cb: () => void): this;
        on(event: 'close', cb: (reason: string) => void): this;
        on(event: 'spawn', cb: (reason: string) => void): this;
        on(event: 'clientbound', listener: (packet, options: PacketBufferParsed & { canceled: boolean }) => void): this;
        on(event: 'serverbound', listener: (packet, options: PacketBufferParsed & { canceled: boolean }) => void): this;

        $hook$readUpstream$parsing_error?(buffer: Buffer, e);
        $hook$readUpstream$parsed?(buffer: Buffer, parsed: PacketBufferParsed & { canceled: boolean });
        $hook$readUpstream$emitted?(buffer: Buffer, parsed: PacketBufferParsed & { canceled: boolean });
    }
    export interface Relay extends Server {
        options: RelayOptions;
        clients: Record<string, RelayPlayer>;
        RelayPlayer: typeof RelayPlayer;
        upstreams: Map<unknown, Client>;
        openUpstreamConnection(client: RelayPlayer, clientAddr);
        on(event: 'connect', cb: (client: RelayPlayer) => void): this;
        on(event: 'join', listener: (client: RelayPlayer, server: Client) => void): this;
        on(event: 'error', listener: (error: unknown) => void): this;
    }

    export interface ServerAdvertisement {
        fromString(message: string): this;
        toBuffer(): Buffer;
    }

}
