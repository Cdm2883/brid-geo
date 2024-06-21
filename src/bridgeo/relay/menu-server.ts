import * as paths from "node:path";

import { ping, Player } from "bedrock-protocol";

import { lifecycle } from "@/bridgeo/plugin/lifecycle";
import { MenuButtonForm, MenuCustomForm, MenuDialogForm } from "@/bridgeo/relay/flow/menu-form";
import form from "@/bridgeo/relay/packets/form";
import notification from "@/bridgeo/relay/packets/notification";
import { createRelay, findOrCreateRelay } from "@/bridgeo/relay/starter";
import { generatedBridgeoConfig } from "@/bridgeo/utils/js/bridgeo-config";
import { BridgeoPaths } from "@/bridgeo/utils/js/file-utils";
import createJsonBinding from "@/bridgeo/utils/js/json-binding";
import { Logger, logify } from "@/bridgeo/utils/js/logger";
import packageJson from "@/bridgeo/utils/js/package";
import { findFreeUdpPort } from "@/bridgeo/utils/js/port-utils";
import { trimTemplate } from "@/bridgeo/utils/js/template-literals";
import EmptyServer from "@/bridgeo/utils/mc/empty-server";
import { mchalk } from "@/bridgeo/utils/mc/mc-formatter";

export async function initRelay() {
    const destination = generatedBridgeoConfig.destination;
    if (!destination || !destination.host) return await initMenuServer();
    await createRelay({
        ...generatedBridgeoConfig,
        port: await findFreeUdpPort(generatedBridgeoConfig.port)
    });
}


declare module '@/bridgeo/plugin/lifecycle' {
    interface Lifecycle {
        on(event: 'bridgeo.menu_server_started', listener: (server: EmptyServer) => void): void;
    }
}

const logger = new Logger('MenuServer').inPool();
async function initMenuServer() {
    const server = new EmptyServer({
        ...generatedBridgeoConfig,
        port: await findFreeUdpPort(generatedBridgeoConfig.port),
        motd: {
            motd: `BridGeo v${packageJson.version}`,
            levelName: 'brid-geo'
        }
    });

    const path = paths.resolve(BridgeoPaths.CONFIGS, 'bridgeo-menu-server.json');
    const config  = createJsonBinding(path, {} as Record<string, {
        name: string;
        host: string;
        port: number;
        owner: string;
    }>, true);

    const main = (client: Player): void => new MenuButtonForm(client)
        .setTitle('BridGeo Ready...')
        .setContent('选择目标服务器')
        .addButton(mchalk.bold.green('添加服务器 ▼'), form.textures('textures/ui/world_glyph_color_2x_black_outline'))
        .onClick(() => add(client))
        .scope(menu => Object.entries(config).forEach(([ id, record ]) => {
            menu.addButton(trimTemplate`
                ${record.name}
                ${mchalk.italic.gray}${record.host}:${record.port} (${record.owner})
            `, () => check(client, id));
        }))
        .send(() => client.disconnect('已退出 Bridgeo 菜单服务器'));

    const add = (client: Player) => new MenuCustomForm(client)
        .setTitle('添加服务器')
        .observe(form => {
            const name = form.input('名称');
            const host = form.input('地址');
            const port = form.input('端口');
            form.response.submit = () => config[Math.random().toString(32).slice(2)] = {
                name: name.value,
                host: host.value,
                port: Number(port.value),
                owner: client.profile!.name
            };
        })
        .addCallback(() => main(client))
        .send();

    const check = (client: Player, id: string) => new MenuButtonForm(client)
        .setTitle('目标服务器')
        .setContent(trimTemplate`
            名称: ${config[id].name}
            地址: ${config[id].host}
            端口: ${config[id].port}
            添加者: ${config[id].owner}
        `)
        .addButton('获取服务器状态', form.textures('textures/ui/servers'), () => pinging(client, id))
        .addButton('启动代理', form.textures('textures/ui/anvil_icon'), () => start(client, id))
        .scope(menu => {
            const record = config[id];
            if (record.owner !== client.profile!.name) return;
            menu.addButton('编辑服务器', form.textures('textures/ui/confirm'), () => edit(client, id));
            menu.addButton('删除服务器', form.textures('textures/ui/cancel'), () => deleting(client, id));
        })
        .send(() => main(client));

    const pinging = async (client: Player, id: string) => {
        const record = config[id];
        client.queue(...notification.toast(record.name, '正在获取服务器状态...'));
        try {
            const advertisement = await ping(record);
            new MenuButtonForm(client)
                .setTitle('服务器状态')
                .setContent(trimTemplate`
                    记录: ${record.name} (${record.host}:${record.port}) ${mchalk.italic.gray('@' + record.owner)}
                    MOTD: ${advertisement.motd}${mchalk.clear}
                    版本: ${advertisement.version} (${advertisement.protocol}) ${mchalk.italic.gray('*' + client.version)}
                    玩家: ${advertisement.playersOnline}/${advertisement.playersMax}
                    存档: ${advertisement.levelName} (${advertisement.serverId})
                    端口: ${advertisement.portV4}${mchalk.italic.gray('@v4')} ${advertisement.portV6}${mchalk.italic.gray('@v6')}
                `)
                .send(() => check(client, id));
        } catch (e) {
            new MenuButtonForm(client)
                .setTitle('获取失败')
                .setContent(logify(e))
                .send(() => check(client, id));
        }
    };

    const edit = (client: Player, id: string) => new MenuCustomForm(client)
        .setTitle('编辑服务器')
        .observe(form => {
            const record = config[id];
            const name = form.input('名称', record.name, record.name);
            const host = form.input('地址', record.host, record.host);
            const port = form.input('端口', record.port, record.port);
            form.response.submit = () => {
                config[id].name = name.value;
                config[id].host = host.value;
                config[id].port = Number(port.value);
            };
        })
        .addCallback(() => check(client, id))
        .send();

    const deleting = (client: Player, id: string) => new MenuDialogForm(client)
        .setTitle('删除服务器')
        .setContent('你真的要删除吗? 它会消失很久!')
        .setConfirm('删除', () => delete config[id])
        .setCancel('取消')
        .result().then(() => check(client, id));

    server.on('connect', client => {
        client.on('join', () => {
            logger.info(`| ${client.profile?.name ?? client.connection.address} 已登入 Bridgeo 菜单服务器`);
        });
        client.on('close', () => {
            logger.info(`| ${client.profile?.name ?? client.connection.address} 已离开 Bridgeo 菜单服务器`);
        });
        client.on('spawn', () => setTimeout(main, 200, client));
    });

    const start = async (client: Player, id: string) => {
        client.queue(...notification.broadcast('正在启动代理服务...'));
        try {
            const record = config[id];
            const relay = await findOrCreateRelay({
                ...generatedBridgeoConfig,
                port: await findFreeUdpPort(generatedBridgeoConfig.port),
                destination: {
                    ...generatedBridgeoConfig.destination,
                    host: record.host,
                    port: record.port
                }
            });
            client.queue(...notification.broadcast('代理服务已启动!'));
            client.queue('transfer', {
                server_address: generatedBridgeoConfig.public,
                port: relay.options.port
            });
        } catch (e) {
            client.queue(...notification.broadcast(mchalk.bold.dark_red('代理服务启动失败!')));
            client.queue(...notification.broadcast(mchalk.red(logify(e))));
            setTimeout(check, 5000, client, id);
        }
    };

    await server.listen();
    lifecycle.emit('bridgeo.menu_server_started', server);
    const host = server.options.host;
    logger.info(`> Bridgeo 菜单服务器已启动在 >> ${host === '0.0.0.0' ? '127.0.0.1' : host}:${server.options.port}`);
}
