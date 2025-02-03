// noinspection ES6PreferShortImport,JSCheckFunctionSignatures

import chalk from "chalk";
import { createServer } from "http";
import next from "next";
import { parse } from "url";

import bridgeoConfig from "./bridgeo.config.js";
import startMinecraftServer from "./src/bridgeo/bridgeo.js";
import bridgeoPrepare from "./src/bridgeo/prepare.js";
import { initTerminal } from "./src/bridgeo/terminal.js";
import { globalLogger } from "./src/bridgeo/utils/js/logger.js";
import { version } from "./src/bridgeo/utils/js/package.js";
import { startDataChannel } from "./src/bridgeo/websocket.js";

await initTerminal();
await bridgeoPrepare();

const dev = process.env.NODE_ENV !== 'production';
const hostname = bridgeoConfig.host;
const port = bridgeoConfig.port[0];
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

globalLogger.info(String.raw`  ╔╗ ┬─┐┬┌┬┐ ╔═╗┌─┐┌─┐`);
globalLogger.info(String.raw`  ╠╩╗├┬┘│ ││ ║ ╦├┤ │ │`);
globalLogger.info(String.raw`  ╚═╝┴└─┴─┴┘ ╚═╝└─┘└─┘`);
globalLogger.info('  ' + chalk.underline(`v${version}`));
globalLogger.info();

// noinspection JSIgnoredPromiseFromCall
startMinecraftServer();

await app.prepare();
const wss = startDataChannel();
createServer((req, res) =>
    handle(req, res, parse(req.url, true)))
    .on('upgrade', (request, socket, head) =>
        wss.handleUpgrade(request, socket, head, ws =>
            wss.emit('connection', ws, request)))
    .listen(port, () => {
        const listened = `${hostname === '0.0.0.0' ? '127.0.0.1' : hostname}:${port}`;
        globalLogger.info(`> Next.js/WebSocket服务已启动在: ${listened}`);
    });
