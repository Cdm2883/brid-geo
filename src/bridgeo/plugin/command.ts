import chalk from "chalk";
import _ from "lodash";

import { CliCommander } from "@/bridgeo/plugin/commander-helper";
import { currentLoggers } from "@/bridgeo/terminal";
import { globalLogger, Logger, loggerPool } from "@/bridgeo/utils/js/logger";
import { indent } from "@/bridgeo/utils/js/meta-programming";

export interface CommanderMetadata {
    name: string | string[];
    description?: string;
    hints?: string;
}
export interface Commander {
    command: CommanderMetadata;
    onCommandArgs(raw: string, session: CommanderSession): boolean | void;
}

export interface CommanderSession {
    logger: Logger | null;
    output: Logger;
}

class Commanders extends Array<Commander> {
    logger: Logger | null;
    constructor(logger: Logger | null) {
        super();
        this.logger = logger;
    }

    register(commander: Commander): void;
    register(metadata: CommanderMetadata, onCommandArgs: Commander['onCommandArgs']): void;
    register(arg0: Commander | CommanderMetadata, arg1?: Commander['onCommandArgs']): void;
    register(arg0: Commander | CommanderMetadata, arg1?: Commander['onCommandArgs']): void {
        const commander = arg1 ? {
            command: arg0,
            onCommandArgs: arg1
        } as Commander : arg0 as Commander;
        this.push(commander);
    }
    unregister(commander: Commander) {
        _.pull(this, commander);
    }
    execute(command: string, output = this.logger ?? globalLogger): boolean {
        const split = command.split(' ');
        const main = split[0];
        const args = split.slice(1).join(' ');
        let response = false;
        for (const commander of this) {
            const name = commander.command.name;
            if (typeof name === 'string' ? name !== main : !name.includes(main)) continue;
            const executed = commander.onCommandArgs(args, {
                logger: this.logger,
                output
            }) ?? true;
            response = response || executed;
        }
        return /* this.logger ? response || commanderPool.execute(command, output) : */response;
    }
}
class CommanderPool extends Map<Logger | null, Commanders> {
    static INSTANCE = new this();
    private constructor() {
        super();
    }

    get(key: Logger | null) {
        const got = super.get(key);
        if (got) return got;
        const commanders = new Commanders(key);
        this.set(key, commanders);
        return commanders;
    }

    register(commander: Commander): void;
    register(metadata: CommanderMetadata, onCommandArgs: Commander['onCommandArgs']): void;
    register(arg0: Commander | CommanderMetadata, arg1?: Commander['onCommandArgs']): void {
        return this.get(null).register(arg0, arg1);
    }
    unregister(...args: Parameters<Commanders['unregister']>) {
        return this.get(null).unregister(...args);
    }
    execute(command: string, output = globalLogger) {
        return this.get(null).execute(command, output);
    }
}
export const commanderPool = CommanderPool.INSTANCE;

commanderPool.register(new CliCommander([ 'command', 'cmd' ])
    .describe((program, helper) => program
        .description('Command Manager')
        .argument('[name]', 'command name')
        .option('-g, --global', 'check global commands', true)
        .option('-c, --current', 'check current scope commands', true)
        .option('-a, --all', 'check all commands in all scopes', false)
        .option('-s, --show <hash>', 'check given scope commands (split with ",")')
        .option('-i, --hint', 'show command hint', false)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .action((name: string | undefined, options: any) => {
            const loggers = new Set<Logger | null>();
            if (options.global) loggers.add(null);
            if (options.current) for (const logger of currentLoggers) {
                loggers.add(logger);
            }
            if (options.all) loggerPool.loggers.forEach(logger => loggers.add(logger));
            if (options.show) options.show.split(',').forEach((hash: string) => loggers.add(loggerPool.get(hash)!));

            for (const logger of loggers) {
                let output = '';
                let shownTitle = false;
                for (const { command: { name: command, description, hints } } of commanderPool.get(logger)) {
                    const commands = typeof command === 'string' ? [ command ] : command;
                    if (name && !commands.some(command => command.startsWith(name))) continue;
                    if (!shownTitle) {
                        output += chalk.bold.green(logger === null ? 'Global' : `${logger.names.value}#${logger.hash}`);
                        output += ':\n';
                        shownTitle = true;
                    }
                    output += `- ${commands.join(', ')}`;
                    if (description) output += chalk.italic.gray(`: ${description}`);
                    output += '\n';
                    if (options.hint) {
                        if (hints) output += `${hints}\n`
                            .split('\n')
                            .map(line => indent(1) + chalk.gray(`| ${line}`))
                            .join('\n');
                        output += '\n';
                    }
                }
                output && helper.session.output.info(output);
            }
        })
    ));
