import { createSocket } from "node:dgram";
import { createServer } from "node:net";

export function isTcpPortFree(port: number): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        const server = createServer()
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .once('error', (err: any) => {
                server.close();
                if (err.code === 'EADDRINUSE') {
                    resolve(false);
                } else {
                    reject(err);
                }
            })
            .once('listening', () => {
                server.close(() => resolve(true));
            })
            .listen(port);
    });
}
export async function findFreeTcpPort<T extends number>(ports: T[]): Promise<T> {
    for (const port of ports) {
        if (await isTcpPortFree(port))
            return port;
    }
    throw new Error('No available TCP port found');
}

export function isUdpPortFree(port: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const server = createSocket('udp4')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .once('error', (err: any) => {
                server.close();
                if (err.code === 'EADDRINUSE') {
                    resolve(false);
                } else {
                    reject(err);
                }
            })
            .once('listening', () => {
                server.close(() => resolve(true));
            })
            .bind(port);
    });
}
export async function findFreeUdpPort<T extends number>(ports: T[]): Promise<T> {
    for (const port of ports) {
        if (await isUdpPortFree(port))
            return port;
    }
    throw new Error('No available UDP port found');
}
