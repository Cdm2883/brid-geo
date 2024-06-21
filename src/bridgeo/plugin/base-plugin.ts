import { Lifecycle } from "@/bridgeo/plugin/lifecycle";

export interface PluginMetadata {
    namespace: string;
    name: string;
    description?: string;
    version?: [ number, number, number ];
    author?: string;
}

export type PluginLifecycle = Lifecycle & {
    on(event: 'self.load', listener: () => void): void;
    on(event: 'self.unload', listener: () => void): void;
}

export default abstract class BasePlugin {
    abstract metadata: PluginMetadata;
    lifecycle!: PluginLifecycle;
    onLoad() { return true; }
    onUnload() { return true; }
}
