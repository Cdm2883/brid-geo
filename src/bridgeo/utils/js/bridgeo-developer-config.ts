import { lifecycle } from "@/bridgeo/plugin/lifecycle";

import bridgeoDeveloperConfig from "../../../../bridgeo-developer.config";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface BridgeoDeveloperConfig {}

declare module '@/bridgeo/plugin/lifecycle' {
    interface Lifecycle {
        on(event: 'bridgeo.config_developer_generating', listener: (config: BridgeoDeveloperConfig) => void): void;
    }
}

export const generatedBridgeoDeveloperConfig: BridgeoDeveloperConfig = { ...bridgeoDeveloperConfig };
export function generateBridgeoDeveloperConfig() {
    lifecycle.emit('bridgeo.config_developer_generating', generatedBridgeoDeveloperConfig);
}
