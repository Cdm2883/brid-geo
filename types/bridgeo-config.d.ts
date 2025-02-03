import { RealmsOptions, RelayOptions } from "bedrock-protocol";

export interface BridgeoConfig extends Record<string, any>, RelayOptions {

    /** 要绑定的主机 (使用0.0.0.0绑定所有主机) */
    host?: string,

    /** 要绑定到的端口 (设置为数组则表示程序只能使用这里指定的端口) */
    port?: number | number[],

    /** 游戏版本 (可填写版本号, 协议版本等, 程序会自动修正) */
    version?: string | number,

    /** 是否递归代理 (设置为truthy则表示如果当前代理的服务器将客户端送到了其他服务器, 将递归代理其他服务器) */
    recursive?: boolean,

    /** 一次性代理 (设置为truthy则表示除主代理外, 如果其他代理的玩家人数归零则会关闭当前代理) */
    disposable?: boolean,

    /** 代理前先检查服务器 (是否获取服务器的motd为代理的motd, 可设置为数字以限制ping的次数) */
    ping?: boolean | number,

    /** 服务器的对外地址 (玩家在客户端页面填写的连接地址. 不填默认127.0.0.1) */
    public?: string,

    /** 要代理的服务器 (不填将在玩家连接到服务器时打开菜单以动态选择代理目标) */
    destination?: {
        realms?: RealmsOptions
        host: string
        port: number
        offline?: boolean
    }

}
