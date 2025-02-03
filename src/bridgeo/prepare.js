import * as fs from "fs";
import * as paths from "path";

import bridgeoConfig from "../../bridgeo.config.js";
import { range } from "./utils/js/functions.js";
import { registerPlugin, setupPlugins } from "./utils/js/plugins.js";
import { findFreePort } from "./utils/mc/udp-utils.js";
import { fixVersion } from "./utils/mc/versions.js";

async function bridgeoPrepare() {
    registerPlugin(await import('./features/cross/inject-plugin.js'));

    await processConfig();
    await mergeResourcePacks();
    await setupPlugins();
}

async function processConfig() {
    bridgeoConfig.host ??= '0.0.0.0';

    bridgeoConfig.port ??= 3000;
    if (typeof bridgeoConfig.port === 'number')
        bridgeoConfig.port = [
            bridgeoConfig.port,
            ...range(19132, 25565)
        ];
    bridgeoConfig.getPort = () => findFreePort(bridgeoConfig.port);

    bridgeoConfig.version = fixVersion(bridgeoConfig.version);

    if (bridgeoConfig.ping === true) bridgeoConfig.ping = Infinity;

    bridgeoConfig.public ??= '127.0.0.1';
}

async function mergeResourcePacks() {
    // if (fs.existsSync('./public/packs')) return;
    //
    // const root= './bridgeo-data/packs';
    // const packs = [];
    // for (let name of fs.readdirSync(root)) {
    //     const path = paths.resolve(root, name);
    //     const stat = fs.statSync(path);
    //     if (stat.isDirectory()) packs.push(path);
    // }

    // TODO

    // console.log(packs);

    // if (fs.existsSync('./bridgeo-data/json-storage')) return;
}

export default bridgeoPrepare;
