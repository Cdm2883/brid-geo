import { Client, Relay, Server } from "bedrock-protocol";

import { globalLogger } from "../../../utils/js/logger.js";

class VersionRelay {
    constructor(options) {}
}

// class VersionRelay extends Relay {
//     constructor(options) {
//         if (options.destination.realms) throw new TypeError('VersionRelay does not support Realms');
//         super(options);
//     }
//
//     async openUpstreamConnection(ds, clientAddr) {
//         const client = new Client({
//             ...this.options,
//             ...this.options.destination,
//             username: this.options.offline ? ds.profile.name : ds.profile.xuid,
//             // version: this.options.version,
//             onMsaCode: code => this.options.onMsaCode
//                 ? this.options.onMsaCode(code, ds)
//                 : ds.disconnect("It's your first time joining. Please sign in and reconnect to join this server:\n\n" + code.message),
//             autoInitPlayer: false
//         });
//
//         if (!client.noLoginForward) client.options.skinData = ds.skinData;
//         client.ping()
//             .then(_ => client.connect())
//             .catch(err => this.emit('error', err));
//
//         client.outLog = ds.upOutLog;
//         client.inLog = ds.upInLog;
//         client.once('join', () => {
//             client.write('client_cache_status', { enabled: this.enableChunkCaching });
//             ds.upstream = client;
//             ds.flushUpQueue();
//             client.readPacket = packet => ds.readUpstream(packet);
//
//             this.emit('join', /* client connected to proxy */ ds, /* backend server */ client);
//         });
//         client.on('error', err => {
//             ds.disconnect('Server error: ' + err.message);
//             this.upstreams.delete(clientAddr.hash);
//         });
//         client.on('close', reason => {
//             ds.disconnect('Backend server closed connection: ' + reason);
//             this.upstreams.delete(clientAddr.hash);
//         });
//
//         this.upstreams.set(clientAddr.hash, client);
//     }
//
//     onOpenConnection = conn => {
//         if (this.forceSingle && this.clientCount > 0) return conn.close();
//
//
//
//
//
//         // for (const [ ,,, version ] of versions) {
//         //     const shadow = new Server({ ...this.options, version });
//         //     const fakeServer = {
//         //         version,
//         //         features: shadow.features,
//         //         serializer: shadow.serializer,
//         //         deserializer: shadow.deserializer,
//         //         compressionAlgorithm: shadow.compressionAlgorithm,
//         //         compressionLevel: shadow.compressionLevel,
//         //         compressionThreshold: shadow.compressionThreshold,
//         //         __proto__: this
//         //     };
//         //     const player = new this.RelayPlayer(fakeServer, conn);
//         //     let connectable = false;
//         //     player.on('login', () => {
//         //         console.log(version);
//         //         connectable = true;
//         //         this.clientCount++;
//         //         this.clients[conn.address] = player;
//         //         this.emit('connect', player);
//         //         this.openUpstreamConnection(player, conn.address);
//         //     });
//         //     player.on('close', _ => {
//         //         if (!connectable) return;
//         //         this.clientCount--;
//         //         delete this.clients[conn.address];
//         //     });
//         // }
//
//
//
//         // const version = fixVersion('1.20.72');
//         // const shadow = new Server({ ...this.options, version });
//         // const fakeServer = {
//         //     version,
//         //     features: shadow.features,
//         //     serializer: shadow.serializer,
//         //     deserializer: shadow.deserializer,
//         //     compressionAlgorithm: shadow.compressionAlgorithm,
//         //     compressionLevel: shadow.compressionLevel,
//         //     compressionThreshold: shadow.compressionThreshold,
//         //     __proto__: this
//         // };
//         //
//         // this.clientCount++;
//         // const player = new this.RelayPlayer(fakeServer, conn);
//         // this.clients[conn.address] = player;
//         // this.emit('connect', player);
//         // player.on('login', () => {
//         //     this.openUpstreamConnection(player, conn.address);
//         // });
//         // player.on('close', _ => {
//         //     this.clientCount--;
//         //     delete this.clients[conn.address];
//         // });
//
//
//         // this.clientCount++;
//         // const player = new this.RelayPlayer(this, conn);
//         // this.clients[conn.address] = player;
//         // this.emit('connect', player);
//         // player.on('login', () => this.openUpstreamConnection(player, conn.address));
//         // player.on('close', _ => {
//         //     this.clientCount--;
//         //     delete this.clients[conn.address];
//         // });
//
//
//
//
//
//     };
// }

export default VersionRelay;
