// noinspection JSIgnoredPromiseFromCall,JSUnresolvedReference

import { ping } from "bedrock-protocol";

import bridgeoConfig from "../../bridgeo.config.js";
import {
    build as modalFormRequestPacket,
    button,
    custom_form,
    form,
    input, inputDefaulted,
    textures
} from "./packets/modal_form_request.js";
import { build as textPacket } from "./packets/text.js";
import { build as toastRequestPacket } from "./packets/toast_request.js";
import { build as transferPacket } from "./packets/transfer.js";
import { createRelay, findOrCreateRelay } from "./relay.js";
import createJsonStorage from "./utils/js/json-storage.js";
import { globalLogger } from "./utils/js/logger.js";
import { version } from "./utils/js/package.js";
import { lifecycle } from "./utils/js/plugins.js";
import { startEmptyServer } from "./utils/mc/empty-server.js";
import { SS, ss } from "./utils/mc/mc-text.js";
import { globalId } from "./utils/mc/packets.js";
import { optionsDestinationTo } from "./utils/mc/relays.js";

let { host, destination } = bridgeoConfig;

function startMinecraftServer() {
    // 启动菜单服务器
    if (destination == null) return startMenuServer();

    switch (typeof destination) {

    // 直接启动代理
    case "object":
        createRelay(bridgeoConfig);
        break;
        
    // 获取函数返回值然后重新判断
    case "function":
        destination = destination();
        startMinecraftServer();
        break;
        
    default:
        throw Error(`未知的"destination"字段`);
        
    }
}

async function startMenuServer() {
    const port = await bridgeoConfig.getPort();
    const options = Object.freeze({
        ...bridgeoConfig, port,
        destination: undefined,
        offline: true,
        maxPlayers: 1,
        motd: {
            motd: `BridGeo v${version}`,
            levelName: 'brid-geo'
        }
    });

    const onConnect = client => {
        client.on('join', () => {
            globalLogger.info(`| ${client.profile.name} 已登入 BridGeo 服务器菜单`);
        });
        client.on('close', () => {
            globalLogger.info(`| ${client.profile.name} 已离开 BridGeo 服务器菜单`);
        });
    };
    
    const onSpawn = client => openMenu(client, async server => {
        const send = (msg) => client.write(...textPacket.chat("BridGeo", msg));

        send(`正在启动代理服务...`);
        let relay = await findOrCreateRelay(optionsDestinationTo(bridgeoConfig, server.host, server.port));
        send(`代理服务已启动!`);
        client.queue(...transferPacket(bridgeoConfig.public, relay.options.port));
    });

    const server = await startEmptyServer(options, onConnect, onSpawn);
    lifecycle.emit('bridgeo.start_menu_server', server);
    globalLogger.info(`> BridGeo服务器已启动在: ${host === '0.0.0.0' ? '127.0.0.1' : host}:${port}`);
}

function openMenu(client, onStartRelay) {
    const storage = createJsonStorage('bridgeo-server-menu', { servers: [] });
    const toast = msg => client.queue(...toastRequestPacket(`${SS}l[BridGeo]`, msg));

    async function main() {
        toast(ss[5]`正在加载服务器状态...`);
        let buttons = await Promise.all(
            storage.servers.map(async server => {
                try {
                    return { ...await ping(server), ...server };
                } catch (e) {
                    return { ...server, timeOut: true };
                }
            }));
        toast(ss[2]`服务器状态加载完成`);

        // 变成表单能用的格式
        buttons = buttons.map(server => {
            const { name, motd, playersOnline, playersMax,
                host, port, protocol, timeOut } = server;
            const text = timeOut ? `${name}\n${SS}4${host}:${port}`
                : `${name}\n${motd} (${playersOnline}/${playersMax})`;
            let additional = '';
            additional = !timeOut && protocol > client.version ?
                ss._l4` *${protocol}>${client.version}` : additional;
            additional = !timeOut && protocol < client.version ?
                ss._l4` *${protocol}<${client.version}` : additional;
            return {
                text: `${text}${additional}`,
                image: textures(`textures/ui/${timeOut ? 'addServer' : 'servers'}`)
            };
        });
        
        client.queue(...modalFormRequestPacket(++globalId.i, {
            ...form('BridGeo Ready...', '选择目标服务器'),
            buttons: [
                button(ss._l2`添加服务器 ▼`, textures('textures/ui/world_glyph_color_2x_black_outline')),
                ...buttons
            ]
        }));
        client.once('modal_form_response', packet => {
            if (packet.has_cancel_reason) return client.disconnect("已退出 BridGeo 菜单");
            let data = Number(packet.data);
            if (data === 0) return addServer();
            
            checkServer(data - 1);
        });
    }

    function checkServer(index) {
        let server = storage.servers[index];
        client.queue(...modalFormRequestPacket(++globalId.i, {
            ...form(
                '目标服务器',
                `名称#NAME: ${server.name}${SS}r\n`
                + `地址#HOST: ${server.host}\n`
                + `端口#PORT: ${server.port}`
            ),
            buttons: [
                button(`编辑服务器`, textures('textures/ui/servers')),
                button(`删除服务器`, textures('textures/ui/cancel')),
                button(`代理服务器`, textures('textures/ui/anvil_icon')),
            ]
        }));
        client.once('modal_form_response', packet => {
            if (packet.has_cancel_reason) {
                if (index !== 0) storage.servers.unshift(storage.servers.splice(index , 1)[0]);
                return main();
            }
            let data = Number(packet.data);
            switch (data) {

            case 0:
                editServer(index);
                break;

            case 1:
                storage.servers.splice(index, 1);
                main();
                break;

            case 2:
                onStartRelay(storage.servers[index]);
                break;

            }
        });
    }

    function editServer(index) {
        let server = storage.servers[index];
        client.queue(...modalFormRequestPacket(++globalId.i, {
            ...custom_form('编辑服务器'),
            content: [
                inputDefaulted('名称 #NAME', server.name),
                inputDefaulted('地址 #HOST', server.host),
                inputDefaulted('端口 #PORT', server.port),
            ]
        }));
        client.once('modal_form_response', packet => {
            if (packet.has_cancel_reason) return main();
            let data = JSON.parse(packet.data);
            storage.servers[index] = {
                name: data[0] || server.name,
                host: data[1] || server.host,
                port: Number(data[2] || server.port)
            };
            return main();
        });
    }

    function addServer() {
        client.queue(...modalFormRequestPacket(++globalId.i, {
            ...custom_form('添加服务器'),
            content: [
                input('名称 #NAME', 'Minecraft Server'),
                input('地址 #HOST', '127.0.0.1'),
                input('端口 #PORT', '19132'),
            ]
        }));
        client.once('modal_form_response', packet => {
            if (packet.has_cancel_reason) return main();
            let data = JSON.parse(packet.data);
            storage.servers.push({
                name: data[0] || 'Minecraft Server',
                host: data[1] || '127.0.0.1',
                port: Number(data[2] || '19132')
            });
            return main();
        });
    }

    main();
}

export default startMinecraftServer;
