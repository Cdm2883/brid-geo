import * as bedrock from "bedrock-protocol";
import _ from "lodash";
import * as mc from "minecraft-protocol";

import { CHECK } from "../../../utils/js/type-check.js";
import favicon from "./favicon.js";

class EditionRelay extends mc.Server {
    constructor(version, customPackets, hideErrors = false) {
        // noinspection JSCheckFunctionSignatures
        super(version, customPackets, hideErrors);
        this.on('playerJoin', client => this.onPlayerJoin(client));
    }

    /** @param { ServerClient } client */
    onPlayerJoin(client) {
        let server = bedrock.createClient({
            ...this.options.destination,
            username: client.username,
            conLog: () => void 0,
            onMsaCode: data =>
                client.end(`这是你第一次加入，请登录并重新连接以加入此服务器：\n\n`
                + `若要登录，请使用 Web 浏览器打开页面 ${data.verification_uri} 并使用代码 ${data.user_code} `
                + `或访问 http://microsoft.com/link?otc=${data.user_code}`)
        });

        const relayContext = {
            client, server
        };

        server.on('error', (err) => {
            client.end('Server error: ' + err.message);
        });
        server.on('close', (reason) => {
            client.end('Backend server closed connection: ' + reason);
        });

        client.on('end', reason => {
            server.close(reason);
        });

        server.on('packet',  async (
            { data: { name, ...args } }
        ) => import(`./trans-server/${name}.js`)
            .then(({ default: trans }) => {
                trans.call(relayContext, { name, ...args });
            }));

    }
}

function EditionRelayCreator(options) {
    CHECK.IsNotDefined({ options });
    const { destination } = options;
    CHECK.IsNotDefined({ destination });

    let extend = {};
    if (options.ping) {
        if (options.ping === true) options.ping = Infinity;
        let times = _.cloneDeep(options.ping), responded;
        let advertisement = { favicon },
            refresh = () => void bedrock.ping(destination)
                .then(pinged => advertisement = {
                    ...advertisement,
                    players: { max: pinged.playersMax, online: pinged.playersOnline, sample: [] },
                    description: { text: pinged.motd },
                })
                .catch(reason => advertisement = {
                    players: { max: 514, online: 114, sample: [] },
                    description: { text:
                            `> 无法获取服务器信息: `
                            + `${destination.host}:${destination.port}`
                            + ` (${reason.message})` },
                });
        // noinspection CommaExpressionJS
        extend.beforePing = response => times-- <= 0 ? responded
            : responded = (refresh(), { ...response, ...advertisement });
        refresh();
    }

    return mc.createServer({
        ...options, ...extend,
        Server: EditionRelay
    });
}

// new EditionRelayCreator(...)
export default EditionRelayCreator;

// export function test(){
//     new EditionRelayCreator({
//         port: 25565,
//         version: '1.16.5',
//         ping: true,
//         destination: {
//             host: '127.0.0.1',
//             port: 19132,
//             // host: 'play.gwbbs.top',
//             // port: 19132,
//             // version: '1.20.62',
//             version: '1.20.30'
//         }
//     });
// }
