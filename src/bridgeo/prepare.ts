import { loadPlugins } from "@/bridgeo/plugin/loader";
import { generateBedrockProtocol } from "@/bridgeo/utils/def/gen-bedrock-protocol";
import { generateBridgeoDeveloperConfig } from "@/bridgeo/utils/js/bridgeo-developer-config";
import { BridgeoPaths, createDirIfNotExists } from "@/bridgeo/utils/js/file-utils";
import { Logger } from "@/bridgeo/utils/js/logger";

const logger = new Logger('Preparation').inPool();

export async function prepare() {
    try {
        await trying();
    } catch (e) {
        logger.warn(e);
        logger.warn('准备工作未完成, Bridgeo 运行时可能会出现异常!');
    }
}

async function trying() {
    createDirIfNotExists(BridgeoPaths.PLUGINS);
    await loadPlugins();

    generateBridgeoDeveloperConfig();
    // mergeResourcePacks();
    generateBedrockProtocol();
}
