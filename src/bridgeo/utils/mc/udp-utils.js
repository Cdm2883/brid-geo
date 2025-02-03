import { createSocket } from "dgram";

function isPortFree(port) {
    return new Promise((resolve, reject) => {
        const server = createSocket('udp4');
        server.on('error', (err) => {
            server.close();
            if (err.code === 'EADDRINUSE') resolve(false);
            else reject(err);
        });
        server.on('listening', () =>
            server.close(() =>
                resolve(true)));
        server.bind(port);
    });
}

async function findFreePort(ports = [ 19132, 19133 ]) {
    for (let port of ports)
        if (await isPortFree(port))
            return port;
    throw new Error('No available UDP port found');
}

export { isPortFree, findFreePort };
