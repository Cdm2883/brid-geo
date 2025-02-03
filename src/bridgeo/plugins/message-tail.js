// noinspection JSUnusedGlobalSymbols,JSUnresolvedReference

import { ss } from "../utils/mc/mc-text.js";

export const metadata = {
    namespace: "vip.cdms.message-tail",
    name: "消息小尾巴",
    description: "示例插件, 似乎没什么实际用处?",
    version: [ 1, 0, 0 ],
    author: "Cdm2883"
};
const config = {
    chat: ss._ro7` // BGO~`
};

for (let [ type, formatter ] of Object.entries(config))
    if (typeof formatter !== 'function')
        config[type] = text => text + formatter;
export function onClientPackets({ name, params }) {
    if (name !== 'text') return;
    const formatter = config[params.type];
    if (formatter) params.message = formatter.call(this, params.message);
}
