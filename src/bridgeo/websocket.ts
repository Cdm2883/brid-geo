import { WebSocketServer } from "ws";

import { Logger } from "@/bridgeo/utils/js/logger";

const logger = new Logger('WebSocket').inPool();
export let wss: WebSocketServer;
export function initWebsocket(): WebSocketServer {
    wss = new WebSocketServer({ noServer: true });

    wss.on('connection', ws => {
        // ws.on('error', logger.error);

        // ...
    });

    return wss;
}
