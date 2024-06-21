import BasePlugin from "@/bridgeo/plugin/base-plugin";

export default abstract class PluginRegister<T> {
    plugin: BasePlugin;
    constructor(plugin: BasePlugin) {
        this.plugin = plugin;
    }
    abstract register(handler: T): void;
    static register<T>(handler: BasePlugin & T) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        const register = new this(handler);
        register.register(handler);
    }
}
