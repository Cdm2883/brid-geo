import BasePlugin, { PluginMetadata } from "@/bridgeo/plugin/base-plugin";

export default class Bstats extends BasePlugin {
    metadata: PluginMetadata = {
        namespace: 'bridgeo.bstats',
        name: 'bStats',
        description: '使用 bStats 收集 Bridgeo 的使用数据',
        version: [ 0, 1, 0 ],
        author: 'Official'
    };
    onLoad(): boolean {
        return super.onLoad();
    }
}
