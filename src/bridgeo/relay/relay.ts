import { Client, Relay, RelayOptions } from "bedrock-protocol";

import CommonRelayPlayer from "@/bridgeo/relay/relay-player";

// noinspection JSUnusedGlobalSymbols
export declare interface CommonRelay {
    clients: Record<string, CommonRelayPlayer>;
    on(event: 'connect', cb: (client: CommonRelayPlayer) => void): this;
    on(event: 'create_forward_backend', cb: (client: CommonRelayPlayer, server: Client) => void): this;
    on(event: 'join', listener: (client: CommonRelayPlayer, server: Client) => void): this;
    on(event: 'error', listener: (error: unknown) => void): this;
    on(event: 'closing', listener: () => void): this;
}
export class CommonRelay extends Relay {
    running = false;
    constructor(options: RelayOptions) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        options.relayPlayer = CommonRelayPlayer;
        super(options);
        this.setMaxListeners(Infinity);
        // TODO 无需网页登录
        // TODO 在数据包事件最终处理完后如果与原来比较发现未做修改则直接发送原来的buffer而不是再用协议定义重新组装成buffer (可以有效防止大部分包破损, 但会增加性能消耗, 作为可选配置默认关闭)
    }
    
    openUpstreamConnection(client: CommonRelayPlayer, clientAddr: unknown) {
        const fakeSet = (addr: unknown, server: Client) => {
            this.emit('create_forward_backend', client, server);
            return this.upstreams.set(addr, server);
        };
        const fakeUpstreams = new Proxy(this.upstreams, {
            get: (target, p, receiver) =>
                p === 'set' ? fakeSet : Reflect.get(target, p, receiver).bind(target)
        });
        const fakeRelay = new Proxy(this, {
            get: (target, p, receiver) =>
                p === 'upstreams' ? fakeUpstreams : Reflect.get(target, p, receiver)
        });
        super.openUpstreamConnection.call(fakeRelay, client, clientAddr);
    }

    listen(host?: string, port?: number) {
        this.running = true;
        return super.listen(host, port);
    }

    async close(disconnectReason = 'Server closed') {
        this.running = false;
        this.emit('closing');
        return await super.close(disconnectReason);
    }
}
export default CommonRelay;
