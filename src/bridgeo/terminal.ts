import * as fs from "node:fs";
import * as paths from "node:path";
import * as readline from "node:readline";

import chalk from "chalk";

import { commanderPool } from "@/bridgeo/plugin/command";
import { lifecycle } from "@/bridgeo/plugin/lifecycle";
import { unloadPlugins } from "@/bridgeo/plugin/loader";
import { relays } from "@/bridgeo/relay/starter";
import { BridgeoPaths, createParentDirIfNotExists } from "@/bridgeo/utils/js/file-utils";
import { binding } from "@/bridgeo/utils/js/functions";
import { colorless, Logger, loggerPool } from "@/bridgeo/utils/js/logger";
import { typeCenter } from "@/bridgeo/utils/js/terminal-typography";
import { toAnsiColorFormat } from "@/bridgeo/utils/mc/mc-formatter";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
rl.setPrompt('# ');
rl.prompt();
readline.emitKeypressEvents(process.stdin, rl);
if (process.stdin.isTTY) process.stdin.setRawMode(true);

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

declare module '@/bridgeo/plugin/lifecycle' {
    interface Lifecycle {
        on(event: 'terminal.keypress', listener: (str: string | undefined, key: {
            sequence: string;
            name: string;
            ctrl: boolean;
            meta: boolean;
            shift: boolean;
            code?: string;
        }) => void): void;
        on(event: 'terminal.input', listener: (inputted: string) => void): void;
        on(event: 'terminal.line', listener: (input: string) => void): void;
        on(event: 'terminal.close', listener: () => void): void;
    }
}

export const loggerStatues = new Map<Logger, boolean>();
loggerStatues.get = logger => Map.prototype.get.call(loggerStatues, logger) ?? true;
export const currentLoggers: Iterable<Logger> = loggerPool.loggers.filter(logger => loggerStatues.get(logger));

export let inputted = '';

export function initTerminal() {
    interface Screen {
        cache: string[];
        path: string;
        stream: fs.WriteStream;
    }
    const screens = new Map<Logger, Screen>();
    const logOutput = paths.resolve(BridgeoPaths.LOGS, new Date()
        .toISOString()
        .replaceAll('/', '-')
        .replaceAll(':', '_'));
    screens.get = logger => {
        const got = Map.prototype.get.call(screens, logger);
        if (got) return got;
        const names = logger.names.value
            .replaceAll('[', '')
            .replaceAll(']', '')
            .replaceAll(' ', '_');
        const path = paths.resolve(logOutput, `${names}#${logger.hash}.log`);
        createParentDirIfNotExists(path);
        const screen: Screen = {
            cache: [],
            path,
            stream: fs.createWriteStream(path)
        };
        screens.set(logger, screen);
        return screen;
    };

    loggerPool.on('log', (logger, content) => {
        if (loggerStatues.get(logger)) {
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0);
            const styled = toAnsiColorFormat(content);
            consoleReal.log(styled);
            rl.prompt(true);
        }

        const screen = screens.get(logger)!;
        screen.stream.write(colorless(content));
        screen.stream.write('\n');
        screen.cache.push(content);
        const slice = screen.cache.length - process.stdout.rows;
        if (slice > 0) screen.cache = screen.cache.slice(slice);
    });

    process.stdin.on('keypress', (str, key) => {
        if (str === undefined || [ 'left', 'right', 'up', 'down' ].includes(key.name)) {}
        else if (key.name === 'backspace') inputted = inputted.slice(0, -1);
        else inputted += str;
        lifecycle.emit('terminal.keypress', str, key);
        lifecycle.emit('terminal.input', inputted);
    });
    rl.on('line', input => {
        inputted = '';
        lifecycle.emit('terminal.line', input);

        let response = commanderPool.execute(input);
        for (const logger of currentLoggers) {
            response = response || commanderPool.get(logger).execute(input);
        }
        if (!response) consoleReal.log(chalk.red('没有命令做出响应'));

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

        lifecycle.emit('terminal.close');

        unloadPlugins();
        relays.forEach(relay => relay.close('BridGeo Close'));
        process.exit(0);
    });



    commanderPool.register({
        name: [ 'clear', 'cls' ],
        description: 'Clear the console'
    }, () => {
        console.clear();
        for (const screen of screens.values()) {
            screen.cache.length = 0;
        }
    });

    // commanderPool.register(new CliCommander('screen')
    //     .describe(program => program));

}
