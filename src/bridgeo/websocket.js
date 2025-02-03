import { WebSocketServer } from "ws";

let wss;
function startDataChannel() {
    wss = new WebSocketServer({ noServer: true });
    
    wss.on('connection', function connection(ws) {
        // ws.on('error', logger.error);

        // ...
    });
    
    return wss;
}

export { wss, startDataChannel };
