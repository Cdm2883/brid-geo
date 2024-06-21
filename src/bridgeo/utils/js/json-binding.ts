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
        get(target, key, receiver) {
            if (dynamic) read();
            const value = Reflect.get(target, key, receiver);
            if (value === null) return value;
            return typeof value === 'object' ? new Proxy(value as object, handler) : value;
        },
        set(target, key, value) {
            const result = Reflect.set(target, key, value);
            write();
            return result;
        },
        defineProperty(target: T, property: string | symbol, attributes: PropertyDescriptor) {
            const result = Reflect.defineProperty(target, property, attributes);
            write();
            return result;
        },
        deleteProperty(target: T, p: string | symbol) {
            const result = Reflect.deleteProperty(target, p);
            write();
            return result;
        }
    };
    return new Proxy(json, handler);
}
