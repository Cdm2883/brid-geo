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
export function createParentDirIfNotExists(path: string) {
    return createDirIfNotExists(paths.resolve(path, '..'));
}

export function simpleWriteFile(file: string, data: string | NodeJS.ArrayBufferView) {
    createParentDirIfNotExists(file);
    fs.writeFileSync(file, data, { encoding: 'utf-8' });
}

export function deletePathForce(path: string) {
    if (!fs.existsSync(path)) return;
    if (fs.lstatSync(path).isFile()) return fs.unlinkSync(path);
    fs.readdirSync(path)
        .map(name => paths.resolve(path, name))
        .forEach(deletePathForce);
    fs.rmdirSync(path);
}
