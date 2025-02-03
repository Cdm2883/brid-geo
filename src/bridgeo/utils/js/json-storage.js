import { mkdirSync, readFileSync, writeFileSync } from "fs";
import * as paths from "path";

import { trying } from "./functions.js";
import { CHECK } from "./type-check.js";

const root = './bridgeo-data/storage';

function createJsonStorage(path, defaultValue, createDefaultFile = false) {
    CHECK.IsNotDefined({ path });

    path = paths.resolve(root, path + '.json');

    mkdirSync(paths.resolve(path, '..'), { recursive: true });
    const save = () => writeFileSync(path, JSON.stringify(json), 'utf8');
    
    // noinspection CommaExpressionJS
    let json = trying(
        () => JSON.parse(readFileSync(path, 'utf8')),
        () => (createDefaultFile && save(), defaultValue)
    );

    const handler = {
        get(target, key, receiver) {
            const value = Reflect.get(target, key, receiver);
            return typeof value === 'object' ? new Proxy(value, handler) : value;
        },
        set(target, key, value) {
            target[key] = value;
            save();
            return true;
        }
    };
    return new Proxy(json, handler);
}

export default createJsonStorage;
