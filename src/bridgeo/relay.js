// noinspection JSCheckFunctionSignatures,JSUnresolvedReference,HttpUrlsUsage,CommaExpressionJS

import { ping, Relay } from "bedrock-protocol";
import _ from "lodash";

import bridgeoConfig from "../../bridgeo.config.js";
import { build as textPacket } from "./packets/text.js";
import { build as toastRequestPacket } from "./packets/toast_request.js";
import { build as transferPacket } from "./packets/transfer.js";
import BetterEventEmitter from "./utils/js/better-event-emitter.js";
import { betterArray, trying } from "./utils/js/functions.js";
import { Logger } from "./utils/js/logger.js";
import { enabledPlugins, lifecycle } from "./utils/js/plugins.js";
import { ss } from "./utils/mc/mc-text.js";
import { optionsDestinationTo } from "./utils/mc/relays.js";

const logger = new Logger('Relay').inPool();
const relays = [];

async function findOrCreateRelay(options) {
    for (let relay of relays)
        if (
            relay.options.destination.host === options.destination.host
            && relay.options.destination.port === options.destination.port
        ) return relay;

    options = _.cloneDeep(options);
    options.port = await bridgeoConfig.getPort();
    return await createRelay(options);
}

async function createRelay(options) {
    const port = await bridgeoConfig.getPort();
    const log = logger.child(`:${port}`).inPool();

    let extend = {};
    if (options.port === bridgeoConfig.port[0]) extend.disposable = false;
    if (options.ping) {
        let times = _.cloneDeep(options.ping);
        let advertisement;
        let refresh = () => trying(async () => {
            if (times-- <= 0) return;
            advertisement = await ping(options.destination);
            advertisement.portV4 = advertisement.portV6 = port;
            extend.advertisementFn = () => (refresh(), advertisement);
        }, e =>
            log.warn(`> 无法获取服务器信息: `
            + `${options.destination.host}:${options.destination.port}`
            + ` (${e.message})`)
        );
        await refresh();
    }

    let running = true;

    // noinspection JSUnusedGlobalSymbols
    const relayOptions = {
        ...options, ...extend, port,
        onMsaCode: (data, client) => client.disconnect(
            // `It's your first time joining. `
            // + `Please sign in and reconnect to join this server:\n\n${data.message}`
            // + '\n\n' +
            `这是你第一次加入，请登录并重新连接以加入此服务器：\n\n`
            + `若要登录，请使用 Web 浏览器打开页面 ${data.verification_uri} 并使用代码 ${data.user_code} `
            + `或访问 http://microsoft.com/link?otc=${data.user_code}`
            // 中英文如果加起来会太长了显示不了...
            // TODO 判断客户端多语言
        ),
    };
    const relayEmit = { class: Relay, options: relayOptions, logger: log };
    lifecycle.emit('relay.creating', relayEmit);
    const relay = new relayEmit.class(relayEmit.options);
    relay.originOptions = Object.freeze(options);
    lifecycle.emit('relay.created', relay, Object.freeze(relayEmit));

    relay.openUpstreamConnection = function (ds, clientAddr) {
        const fakeSet = (addr, client) => {  // 为了以最快的速度拿到client对象
            client.conLog = (...message) => log.info(`<${ds.profile.name}>`, ...message);
            // TODO delete + 3L ?
            client.session ??= {};
            client.options.skinData ??= {};
            client.options.skinData.DeviceModel = 'BridGeo';  // https://github.com/PrismarineJS/bedrock-protocol/blob/c65fea29169ae8079e1a303ce51f06b85eca3b3d/src/handshake/login.js#L70
            relay.emit('relay.create_mitm', client);
            return this.upstreams.set(addr, client);
        };
        const fakeUpstreams = new Proxy(this.upstreams, {
            get: (target, p, receiver) =>
                p === 'set' ? fakeSet : Reflect.get(target, p, receiver).bind(target)
        });
        const fakeRelay = new Proxy(this, {
            get: (target, p, receiver) =>
                p === 'upstreams' ? fakeUpstreams : Reflect.get(target, p, receiver)
        });
        return relayEmit.class.prototype.openUpstreamConnection.call(fakeRelay, ds, clientAddr);
    };
    relay.close = function (disconnectReason) {
        relayEmit.class.prototype.close.call(this, disconnectReason);  // super call
        running = false;
        relays.splice(relays.indexOf(relay), 1);
        log.info(`> Bridgeo已停止代理`);
        log.destroy();
    };

    relay.on('connect', player => {
        player.on('join', () => {
            log.info(`| ${player.profile?.name ?? player.connection.address} 已登入 BridGeo 代理`);
        });
        player.on('close', () => {
            log.info(`| ${player.profile?.name ?? player.connection.address} 已离开 BridGeo 代理`);
        });
    });

    class PacketsEvent extends BetterEventEmitter {  // TODO
        // requires = {};
        // records = { server: betterArray(), client: betterArray() };
        // constructor() {
        //     super();
        //     this.on('_emit', (name, ...args) => {
        //
        //     });
        //
        //     for (const target in this.records) this.on(
        //         target + '.packet',
        //         this.recordPacket.bind(this, target)
        //     );
        // }
        // recordPacket(target, { name, params }) {
        //     const max = this.requires[target + '.' + name] ?? 0;
        //     this.records[target][name] ??= betterArray();
        //     this.records[target][name].push(params);
        //     this.records[target][name].max(max);
        // }
        // require(name, max = 2) {
        //     const current = this.requires[name] ?? 0;
        //     this.requires[name] = Math.max(current, max);
        //     return this;
        // }
    }

    relay.on('join', (
        /* client connected to proxy */ ds,
        /* backend server */ client
    ) => {
        let playing = true;
        const relayContext = {
            logger: log,
            relay,
            packets: new PacketsEvent(),
            get player() { return running && playing ? ds : null; },
            get server() { return running && playing ? client : null; },
        };

        join2player.call(relayContext, ds);

        ds.on('close', () => {
            playing = false;
            options.disposable && running && relay.clientCount === 0 && relay.close();
        });
        ds.on('clientbound', (packet, options) =>
            onClientBound.call(relayContext, packet, options));
        ds.on('serverbound', (packet, options) =>
            onServerBound.call(relayContext, packet, options));

        relay.emit('joined', relayContext);
        lifecycle.emit('relay.joined', relayContext);
    });

    relay.on('error', e => log.error(e));

    await relay.listen();
    log.info(`> BridGeo已开始代理 >> ${options.destination.host}:${options.destination.port}`);
    relays.push(relay);
    return relay;
}

// Server -> Client
function onClientBound(packet, options) {
    server2player.call(this, packet);

    this.packets.emit('server.packet', packet, options);
    this.packets.emit('server.' + packet.name, packet.params, options);

    const packetContext = {
        cancel: () => void (options.canceled = true),
        __proto__: this
    };
    for (const { module } of enabledPlugins)
        module.onServerPackets?.call(packetContext, packet, options);
}
// Client -> Server
function onServerBound(packet, options) {
    client2player.call(this, packet);

    this.packets.emit('client.packet', packet, options);
    this.packets.emit('client.' + packet.name, packet.params, options);

    const packetContext = {
        cancel: () => void (options.canceled = true),
        __proto__: this
    };
    for (const { module } of enabledPlugins)
        module.onClientPackets?.call(packetContext, packet, options);
}

function join2player(player) {
    this.packets.on('server.transfer', ({ server_address, port }, options) => {
        trying(() => this.logger.info(`${player.profile.name} 跳转至服务器 >> ${server_address}:${port}`));

        const recurseRelay = async () => {
            player.queue(...toastRequestPacket(ss.l`[BridGeo]`, `正在启动递归代理...`));
            let relay = await findOrCreateRelay(optionsDestinationTo(this.relay.originOptions, server_address, port));
            player.queue(...transferPacket(bridgeoConfig.public, relay.options.port));
        };

        if (this.relay.options.recursive) {
            options.canceled = true;
            recurseRelay().catch(e => player.queue(...textPacket.chat("BridGeo", shown(e))));
        }
    });

    player.world = {};
    player.local = {};

    // TODO getLevel
    player.getLevel = () => ({
        name: '先意思一下吧',
        id: 'homo114514'
    });
}
function server2player({ name, params }) {
    let player = this.player;
    if (name === 'start_game') {
        player.local.entity_id = params.entity_id;  // player_unique_id
        player.local.runtime_entity_id = params.runtime_entity_id;
        player.local.gamemode = params.player_gamemode;
        player.local.position = params.player_position;
        player.local.pitch = params.rotation.x;
        player.local.yaw = params.rotation.y;
    }
    if (name === 'respawn') {
        player.local.position = params.position;
    }
    if (name === 'set_time') {
        player.world.time = params.time;
    }
    if (name === 'update_player_game_type' && params.player_unique_id === player.local.entity_id) {
        player.world.gamemode = params.gamemode;
    }
    // TODO player list -> world
    // if (name === 'move_player') {
    // }
}
function client2player({ name, params }) {
    let player = this.player;
    // TODO more ways to get player.position
    if (name === 'player_auth_input') {
        player.local.pitch = params.pitch;
        player.local.yaw = params.yaw;
        player.local.position = params.position;
    }
}

export { logger, relays, findOrCreateRelay, createRelay };
