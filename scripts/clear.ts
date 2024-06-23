import chalk from "chalk";

import { BridgeoPaths, deletePathForce } from "@/bridgeo/utils/js/file-utils";

function infoDelete(path: string, name: string) {
    name = chalk.bold(name);
    console.info(`${chalk.yellow('◌')} 正在删除 ${name} ${chalk.gray(`(${path})`)}...`);
    deletePathForce(path);
    console.info(`${chalk.green('✓')} 已删除 ${name}`);
    console.info();
}

infoDelete(BridgeoPaths.CACHE, '缓存');
infoDelete(BridgeoPaths.LOGS, '日志');
infoDelete(BridgeoPaths.GENERATED, '自动生成的文件');
