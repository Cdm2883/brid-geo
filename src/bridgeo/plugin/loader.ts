import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as paths from "node:path";

import _ from "lodash";

import BasePlugin, { PluginMetadata } from "@/bridgeo/plugin/base-plugin";
import { lifecycle } from "@/bridgeo/plugin/lifecycle";
import EventBus from "@/bridgeo/utils/js/event-bus";
import { BridgeoPaths, simpleWriteFile } from "@/bridgeo/utils/js/file-utils";
import { mixinsClassInstance } from "@/bridgeo/utils/js/functions";
import { Logger } from "@/bridgeo/utils/js/logger";

export interface PluginInfo {
    coder: () => string;
    path: string;
    module: unknown;
    plugin: BasePlugin;
}
export const plugins: PluginInfo[] = [];

const logger = new Logger('PluginLoader').inPool();
const builtin = paths.resolve(BridgeoPaths.ROOT, 'src', 'bridgeo', 'plugin', 'builtin');
const search = [ builtin, BridgeoPaths.PLUGINS ];
export async function loadPlugins(
    errorHandler: (file: string, e: unknown) => void
    = (file, e) => logger.warn(`加载插件时出现问题 (${file}):`, e)
) {
    for (const path of search) {
        const dir = fs.readdirSync(path);
        for (const name of dir) {
            if (!/.+\.(js|ts)/.test(name)) continue;
            if (/.+\.disabled\.(js|ts)$/.test(name)) continue;
            const file = paths.resolve(path, name);
            try {
                await loadPluginPath(file);
            } catch (e) {
                errorHandler?.(file, e);
            }
        }
    }
}
export function unloadPlugins(
    errorHandler: (namespace: string, e: unknown) => void
    = (namespace, e) => logger.warn(`卸载插件时出现问题 (${namespace}):`, e)
) {
    const namespaces = plugins.map(info => info.plugin.metadata.namespace);
    for (const namespace of namespaces) {
        try {
            unloadPlugin(namespace);
        } catch (e) {
            errorHandler?.(namespace, e);
        }
    }
}
export async function reloadPlugins(
    errorHandler: (namespace: string, e: unknown) => void
    = (namespace, e) => logger.warn(`重载插件时出现问题 (${namespace}):`, e)
) {
    const namespaces = plugins.map(info => info.plugin.metadata.namespace);
    for (const namespace of namespaces) {
        try {
            await reloadPlugin(namespace);
        } catch (e) {
            errorHandler?.(namespace, e);
        }
    }
}
export async function reloadPlugin(namespace: string) {
    const info = findPlugin(namespace);
    if (!info) return;
    unloadPlugin(info.plugin.metadata.namespace);
    return await loadPlugin(info.coder);
}

export async function loadPluginPath(path: string) {
    const coder = () => fs.readFileSync(path, 'utf-8');
    return await loadPlugin(coder);
}
export async function loadPlugin(coder: () => string): Promise<PluginInfo>;
export async function loadPlugin(code: string): Promise<PluginInfo>;
export async function loadPlugin(arg0: (() => string) | string): Promise<PluginInfo> {
    const coder = typeof arg0 === 'function' ? arg0 : () => arg0;
    const code = coder();
    const hash = createHash('sha256').update(code).digest('hex');
    const path = paths.resolve(BridgeoPaths.CACHE, 'plugin-module', `${hash}.ts`);
    if (!fs.existsSync(path)) simpleWriteFile(path, code);

    const modular = await import('file://' + path);
    const { default: defaulting } = modular;
    if (!defaulting) throw new TypeError("模块没有默认导出");
    
    const clazz = !defaulting.namespace
        ? defaulting  // is metadata
        : mixinsClassInstance(class extends BasePlugin {
            metadata = defaulting as PluginMetadata;
            onLoad() { return modular.onLoad?.(this) ?? super.onLoad(); }
            onUnload() { return modular.onUnload?.(this) ?? super.onUnload(); }
        }, [ modular ], [ 'default', 'onLoad', 'onUnload' ]);
    const plugin = new clazz();
    plugin.lifecycle = new EventBus();
    lifecycle.forward(plugin.lifecycle);

    const info: PluginInfo = { coder, path, module: modular, plugin };
    if (!plugin.onLoad()) throw new EvalError('插件当前不支持加载');
    info.plugin.lifecycle.emit('self.load');
    plugins.push(info);
    return info;
}

export function unloadPlugin(namespace: string) {
    const info = findPlugin(namespace);
    if (!info) throw new ReferenceError('找不到插件');
    if (!info.plugin.onUnload()) throw new EvalError('插件当前不支持卸载');
    info.plugin.lifecycle.emit('self.unload');
    info.plugin.lifecycle.destroy();
    _.pull(plugins, info);
}

export function findPlugin(namespace: string) {
    return plugins.find(info => info.plugin.metadata.namespace === namespace);
}
export async function getPlugin(namespace: string): Promise<PluginInfo> {
    const start = Date.now();
    return new Promise((resolve, reject) => {
        const trial = () => {
            const now = Date.now();
            if (now - start > 5000) return reject(new ReferenceError('找不到插件'));
            const info = findPlugin(namespace);
            info ? resolve(info) : setTimeout(trial);
        };
        trial();
    });
}
export async function importPlugin(namespace: string) {
    const { plugin } = await getPlugin(namespace);
    return plugin;
}
