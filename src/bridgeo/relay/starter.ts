import {
    Client,
    Options,
    ping,
    RelayOptions,
    ServerAdvertisement,
    ServerOptions
} from "bedrock-protocol";
import _ from "lodash";

import { lifecycle } from "@/bridgeo/plugin/lifecycle";
import LocalRecord from "@/bridgeo/relay/local-record";
import PacketBus from "@/bridgeo/relay/packet-bus";
import notification from "@/bridgeo/relay/packets/notification";
import CommonRelay from "@/bridgeo/relay/relay";
import CommonRelayPlayer from "@/bridgeo/relay/relay-player";
import { BridgeoConfig, BridgeoConfigGenerated, generatedBridgeoConfig } from "@/bridgeo/utils/js/bridgeo-config";
import { Logger } from "@/bridgeo/utils/js/logger";
import { findFreeUdpPort } from "@/bridgeo/utils/js/port-utils";
import { mchalk } from "@/bridgeo/utils/mc/mc-formatter";

const relayLogger = new Logger('Relay').inPool();
export const relays: CommonRelay[] = [];

export type BridgeoRelayOptions = Omit<Options, 'port'>
    & ServerOptions
    & RelayOptions
    & Omit<BridgeoConfig, 'port'>
    & Omit<BridgeoConfigGenerated, 'port'>
    & { port: number };

export interface RelayCreatingMaterial {
    class: typeof CommonRelay;
    options: BridgeoRelayOptions;
    logger: Logger;
}
export interface RelayContext {
    readonly playing: boolean;
    readonly logger: Logger;
    readonly relay: CommonRelay;
    readonly packets: PacketBus;
    readonly local: LocalRecord;
    readonly client: CommonRelayPlayer;
    readonly server: Client;
}
declare module '@/bridgeo/plugin/lifecycle' {
    interface Lifecycle {
        on(event: 'relay.creating', listener: (material: RelayCreatingMaterial) => void): this;
        on(event: 'relay.created', listener: (relay: CommonRelay, material: Readonly<RelayCreatingMaterial>) => void): this;
        on(event: 'relay.joined', listener: (context: RelayContext) => void): this;
    }
}

declare module '@/bridgeo/relay/relay' {
    // noinspection JSUnusedGlobalSymbols
    interface CommonRelay {
        logger: Logger;
        options: BridgeoRelayOptions;
        optionsOriginal: BridgeoRelayOptions;
    }
}

export async function findOrCreateRelay(options: BridgeoRelayOptions) {
    return relays.find(relay =>
        relay.options.destination.host === options.destination.host
        && relay.options.destination.port === options.destination.port
    ) ?? await createRelay(options);
}

export async function createRelay(options: BridgeoRelayOptions) {
    const port: number = options.port;
    let logger = relayLogger.child(`:${port}`).inPool();

    const optionsExtends: BridgeoRelayOptions = { ...options };
    if (options.port === generatedBridgeoConfig.port[0]) optionsExtends.disposable = false;
    if (options.ping) {
        let times = options.ping;
        let advertisement: ServerAdvertisement;
        const refresh = async () => {
            if (times-- <= 0) return;
            try {
                advertisement = await ping(options.destination);
                advertisement.portV4 = advertisement.portV6 = port;
                // noinspection CommaExpressionJS
                optionsExtends.advertisementFn = () => (refresh(), advertisement);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (e: any) {
                logger.warn(`> 无法获取服务器信息: `
                    + `${options.destination.host}:${options.destination.port}`
                    + ` (${e.message})`);
            }
        };
        await refresh();
    }

    const optionsFinally: BridgeoRelayOptions = {
        relayPlayer: CommonRelayPlayer,
        ...optionsExtends,
        onMsaCode: (data, client) => client.disconnect(
            // `It's your first time joining. `
            // + `Please sign in and reconnect to join this server:\n\n${data.message}`
            // + '\n\n' +
            `这是你第一次加入，请登录并重新连接以加入此服务器：\n\n`
            + `若要登录，请使用 Web 浏览器打开页面 ${data.verification_uri} 并使用代码 ${data.user_code} `
            + `或访问 https://microsoft.com/link?otc=${data.user_code}`
            // 中英文如果加起来会太长了显示不了...
        ),
    };

    const creatingMaterial: RelayCreatingMaterial = { class: CommonRelay, options: optionsFinally, logger };
    lifecycle.emit('relay.creating', creatingMaterial);
    const relay = new creatingMaterial.class(creatingMaterial.options);
    relay.logger = logger = creatingMaterial.logger;
    relay.optionsOriginal = Object.freeze(options);
    lifecycle.emit('relay.created', relay, Object.freeze(creatingMaterial));

    relay.on('create_forward_backend', (client, server) => {
        server.conLog = (...message) => logger.info(`<${client.profile?.name ?? client.connection.address}>`, ...message);
    });

    relay.on('closing', () => {
        _.pull(relays, relay);
        logger.info(`> Bridgeo 已停止代理`);
        logger.destroy();
    });
    
    relay.on('connect', player => {
        player.on('join', () => {
            logger.info(`| ${player.profile?.name ?? player.connection.address} 已登入 Bridgeo 代理`);
        });
        player.on('close', () => {
            logger.info(`| ${player.profile?.name ?? player.connection.address} 已离开 Bridgeo 代理`);
        });
    });

    relay.on('join', (client, server) => {
        let playing = false;
        const context: RelayContext = {
            get playing() { return playing; },
            logger,
            relay,
            packets: new PacketBus(),
            local: new LocalRecord(),
            client,
            server
        };
        client.setMaxListeners(Infinity);
        server.setMaxListeners(Infinity);
        client.on('close', () => {
            playing = false;
            relay.options.disposable && relay.running && relay.clientCount === 0 && relay.close();
        });
        client.on('clientbound', context.packets.onClientBound.bind(context.packets));
        client.on('serverbound', context.packets.onServerBound.bind(context.packets));
        context.packets.register(context.local);
        context.client.context = context;
        setupRelayPlayer(context);
        lifecycle.emit('relay.joined', context);
    });

    relay.on('error', logger.error.bind(logger));

    relays.push(relay);
    await relay.listen();
    logger.info(`> Bridgeo 已开始代理 >> ${options.destination.host}:${options.destination.port}`);
    return relay;
}

function setupRelayPlayer(context: RelayContext) {
    context.packets.on('server.transfer', async ({ server_address, port }, options) => {
        context.logger.info(`| ${context.client.profile?.name ?? context.client.connection.address} 跳转至服务器 >> ${server_address}:${port}`);
        if (context.relay.options.recursive) {
            options.canceled = true;
            context.client.queue(...notification.toast(mchalk.bold(`[BridGeo]`), `正在启动递归代理...`));
            const transferred = await findOrCreateRelay({
                ...context.relay.optionsOriginal,
                destination: {
                    ...context.relay.optionsOriginal.destination,
                    host: server_address,
                    port
                },
                port: await findFreeUdpPort(generatedBridgeoConfig.port)
            });
            context.client.queue('transfer', {
                server_address: generatedBridgeoConfig.public,
                port: transferred.options.port
            });
        }
    });
}
