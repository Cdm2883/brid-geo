import PluginRegister from "@/bridgeo/plugin/register/plugin-register";
import { Logger } from "@/bridgeo/utils/js/logger";

export interface IPluginRegisterLogger {
    logger: Logger;
    onLoggerRaw?(tag: string, messages: unknown[]): void;
    onLoggerLogging?(content: string): void;
}
export class PluginRegisterLogger extends PluginRegister<IPluginRegisterLogger> {
    register(handler: IPluginRegisterLogger) {
        const onLoggerRaw = handler.onLoggerRaw?.bind(handler);
        if (onLoggerRaw) handler.logger.on('log.raw', onLoggerRaw);

        const onLoggerLogging = handler.onLoggerLogging?.bind(handler);
        if (onLoggerLogging) handler.logger.on('log', onLoggerLogging);

        this.plugin.lifecycle.on('self.unload', () => {
            handler.logger.destroy();
        });
    }
}
