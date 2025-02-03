import { readdirSync, renameSync, statSync } from "fs";
import paths from "path";

import BetterEventEmitter from "./better-event-emitter.js";
import { globalLogger } from "./logger.js";

const root = './src/bridgeo/plugins';


const lifecycle = new BetterEventEmitter();

const outerRegistered = [];
function registerPlugin(module) {
    outerRegistered.push(module);
}

let plugins, enabledPlugins;
async function setupPlugins() {
    // noinspection JSUnresolvedReference
    plugins && plugins.map(plugin => plugin.module.onDisabled?.call());
    plugins = [];

    const traverseJs = path =>
        readdirSync(path).forEach(file => {
            if (file.charAt(0) === '&' || file.charAt(0) === '.') return;
            const filePath = paths.join(path, file);
            const relative = paths.relative(root, filePath);
            const stat = statSync(filePath);
            stat.isDirectory() ? traverseJs(filePath) : plugins.push(relative);
        });
    traverseJs(root);
    plugins.sort((a, b) => a.localeCompare(b));

    plugins = plugins.map(async name => {
        try {
            return { name, module: await import('../../plugins/' + name) };
        } catch (e) {
            globalLogger.error(`插件 ${name} 加载失败!`);

            if (e.code === 'ERR_MODULE_NOT_FOUND') {
                globalLogger.error(e.message);
                let dependence = e.message.match(/^Cannot find package '(.+)' imported from/)?.[1];
                dependence && globalLogger.error(`插件 ${name} 正在导入一个未知的包. 可尝试运行命令 \`npm i ${dependence}\` 进行安装!`);
                return;
            }

            globalLogger.error(e);
        }
    });
    plugins = await Promise.all(plugins);
    plugins = plugins.filter(plugin => plugin != null);

    plugins = plugins.map(plugin => {
        let path = paths.resolve(root, plugin.name);
        let clearName = /^(.+?)(?:\.disabled)?\.js$/.exec(plugin.name)[1];
        let isEnabled = !/.+\.disabled\.js$/.test(plugin.name);
        return {
            ...plugin,
            path, clearName,
            isEnabled,
            setEnable(enable) {
                let name = clearName + (enable ? '' : '.disabled') + '.js';
                renameSync(path, paths.resolve(root, name));
                return true;
            }
        };
    });

    plugins = [ ...plugins, ...outerRegistered.map(module => ({
        name: null, path: null, clearName: null,
        isEnabled: true, setEnable: () => false,
        module
    })) ];

    enabledPlugins = plugins.filter(({ isEnabled }) => isEnabled);
    // noinspection JSUnresolvedReference
    enabledPlugins.map(plugin => plugin.module.onEnabled?.call());

    return plugins;
}

async function getPlugin(plugin) {
    if (typeof plugin !== 'string') return plugin;

    if (plugins === undefined) {
        await setupPlugins();
        return await getPlugin(plugin);
    }

    for (const p of plugins) {
        const {
            path, clearName,
            isEnabled,
            namespace, name,
        } = p;
        if (plugin === namespace || plugin === name
            || plugin === path || plugin === clearName)
            return isEnabled ? p : null;
    }

    return undefined;
}

async function importPlugin(plugin) {
    plugin = await getPlugin(plugin);
    return plugin?.module;
}

export {
    lifecycle, plugins, enabledPlugins,
    registerPlugin, setupPlugins,
    getPlugin, importPlugin
};
