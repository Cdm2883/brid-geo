import BasePlugin, { PluginMetadata } from "@/bridgeo/plugin/base-plugin";

export default class Bstats extends BasePlugin {
    metadata: PluginMetadata = {
        namespace: 'bridgeo.bstats',
        name: 'Bstats',
        description: '统计 Bridgeo 使用情况',
        version: [ 0, 1, 0 ],
        author: 'Official'
    };
    onLoad(): boolean {
        return super.onLoad();
    }
}
