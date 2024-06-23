import * as fs from "node:fs";

import _ from "lodash";

import { simpleWriteFile } from "@/bridgeo/utils/js/file-utils";
import { mixinsObject } from "@/bridgeo/utils/js/functions";

export default function createJsonBinding<T extends object>(path: string, defaultValue: T, dynamic = false): T {
    let json = _.cloneDeep(defaultValue);

    const read = () => json = fs.existsSync(path) ? mixinsObject(json, [ JSON.parse(fs.readFileSync(path, 'utf-8')) ]) : json;
    const write = () => simpleWriteFile(path, JSON.stringify(json, undefined, 4));

    read();

    const handler: ProxyHandler<T> = {
        get(...args) {
            if (dynamic) read();
            const value = Reflect.get(...args);
            if (value === null) return value;
            return typeof value === 'object' ? new Proxy(value as object, handler) : value;
        },
        set(...args) {
            const value = Reflect.set(...args);
            write();
            return value;
        },
        defineProperty(...args) {
            const value = Reflect.defineProperty(...args);
            write();
            return value;
        },
        deleteProperty(...args) {
            const value = Reflect.deleteProperty(...args);
            write();
            return value;
        }
    };
    return new Proxy(json, handler);
}
