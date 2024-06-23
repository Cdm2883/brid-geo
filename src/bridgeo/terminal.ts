import * as readline from "node:readline";

import chalk from "chalk";

import { reloadPlugins, unloadPlugins } from "@/bridgeo/plugin/loader";
import { relays } from "@/bridgeo/relay/starter";
import { binding } from "@/bridgeo/utils/js/functions";
import { Logger, loggerPool } from "@/bridgeo/utils/js/logger";
import { typeCenter } from "@/bridgeo/utils/js/terminal-typography";
import { toAnsiColorFormat } from "@/bridgeo/utils/mc/mc-formatter";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
rl.setPrompt('# ');
rl.prompt();

const consoleReal = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
};
const consoleLogger = new Logger('Console').inPool();
console.info = binding(consoleLogger).info;
console.warn = binding(consoleLogger).warn;
console.error = binding(consoleLogger).error;
console.debug = binding(consoleLogger).debug;
console.log = console.info;

export function initTerminal() {
    loggerPool.on('log', (_, content) => {
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        // TODO 日志文件
        consoleReal.log(toAnsiColorFormat(content));
        rl.prompt(true);
    });

    rl.on('line', input => {
        // TODO
        console.log(input);
        if (input === 'reload') {
            reloadPlugins().then(() => console.log('ok!'));
        }
        rl.prompt(true);
    });
    rl.on('close', () => {
        rl.prompt(false);
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        const columns = process.stdout.columns;
        const cordon = chalk.black.bgYellow('◢◤'.repeat(columns / 2));
        consoleReal.log();
        consoleReal.log(cordon);
        consoleReal.log(chalk.bold.black.bgYellow(typeCenter('正在终止运行', columns)));
        consoleReal.log(cordon);
        consoleReal.log();

        unloadPlugins();
        relays.forEach(relay => relay.close('BridGeo Close'));
        process.exit(0);
    });
}
