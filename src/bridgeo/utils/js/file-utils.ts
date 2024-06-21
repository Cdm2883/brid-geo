import * as fs from "node:fs";
import * as paths from "node:path";
import { fileURLToPath } from "node:url";

export class BridgeoPaths {
    static ROOT = paths.resolve(paths.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');

    static DATA = paths.resolve(this.ROOT, 'bridgeo-data');
    static CACHE = paths.resolve(this.DATA, '.cache');
    static LOGS = paths.resolve(this.DATA, 'logs');
    static CONFIGS = paths.resolve(this.DATA, 'configs');
    static PLUGINS = paths.resolve(this.DATA, 'plugins');
    static STORAGES = paths.resolve(this.DATA, 'storages');

    static GENERATED = paths.resolve(this.ROOT, 'src', 'generated');
}

export function createDirIfNotExists(path: fs.PathLike) {
    const exist = fs.existsSync(path);
    if (exist) return false;
    fs.mkdirSync(path, { recursive: true });
    return true;
}
export function createFileParentDirIfNotExists(path: string) {
    return createDirIfNotExists(paths.resolve(path, '..'));
}

export function simpleWriteFile(file: string, data: string | NodeJS.ArrayBufferView) {
    createFileParentDirIfNotExists(file);
    fs.writeFileSync(file, data, { encoding: 'utf-8' });
}
