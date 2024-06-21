import { createServer } from "node:http";

import chalk from "chalk";
import _ from "lodash";
import next from "next";
import { parse } from "url";

import { prepare } from "@/bridgeo/prepare";
import { initRelay } from "@/bridgeo/relay/menu-server";
import { initTerminal } from "@/bridgeo/terminal";
import { generatedBridgeoConfig } from "@/bridgeo/utils/js/bridgeo-config";
import { globalLogger } from "@/bridgeo/utils/js/logger";
import packageJson from "@/bridgeo/utils/js/package";
import { findFreeTcpPort } from "@/bridgeo/utils/js/port-utils";
import { initWebsocket } from "@/bridgeo/websocket";

initTerminal();
await prepare();

const dev = process.env.NODE_ENV !== 'production';
const hostname = generatedBridgeoConfig.host;
const port = await findFreeTcpPort(generatedBridgeoConfig.port);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

globalLogger.info(String.raw`  ╔╗ ┬─┐┬┌┬┐ ╔═╗┌─┐┌─┐`);
globalLogger.info(String.raw`  ╠╩╗├┬┘│ ││ ║ ╦├┤ │ │`);
globalLogger.info(String.raw`  ╚═╝┴└─┴─┴┘ ╚═╝└─┘└─┘`.slice(2).split('').map(_.unary(chalk.underline)).join('').replace(/^/, '  '));
globalLogger.info('  ' + chalk.bold.black.bgBlue(`v${packageJson.version}`.padEnd(20)));
globalLogger.info();

// noinspection JSIgnoredPromiseFromCall
initRelay();

await app.prepare();
const wss = initWebsocket();
createServer(
    (req, res) =>
        handle(req, res, parse(req.url!, true))
).on('upgrade', (request, socket, head) =>
    wss.handleUpgrade(request, socket, head, ws =>
        wss.emit('connection', ws, request)
    )
).listen(port, () => {
    const listened = `${hostname === '0.0.0.0' ? '127.0.0.1' : hostname}:${port}`;
    globalLogger.info(`> Next.js/WebSocket 服务已启动在: ${listened}`);
});
