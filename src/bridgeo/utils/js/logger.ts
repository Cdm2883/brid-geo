import { createHash } from "node:crypto";
import * as util from "node:util";

import chalk, { ChalkInstance } from "chalk";
import _ from "lodash";

import EventBus from "@/bridgeo/utils/js/event-bus";
import { lazy } from "@/bridgeo/utils/js/functions";


export type Loggable = (...messages: unknown[]) => void;
export interface LoggerLike {
    debug: Loggable;
    info: Loggable;
    warn: Loggable;
    error: Loggable;
    fatal: Loggable;
}


// noinspection JSUnusedGlobalSymbols
export declare interface LoggerPool {
    on(eventName: 'log.raw', listener: (logger: Logger, tag: string, messages: unknown[]) => void): this;
    on(eventName: 'log', listener: (logger: Logger, content: string) => void): this;
}
export class LoggerPool extends EventBus {
    static INSTANCE = new this();
    private constructor() {
        super();
    }

    readonly loggers: Logger[] = [];
    push(logger: Logger): void {
        if (logger.destroyed) throw new ReferenceError();
        logger.forward(this, '*', '*', (...args) => [ logger, ...args ]);
        this.loggers.push(logger);
    }
    pull(logger: Logger) {
        if (!this.loggers.includes(logger)) return;
        _.pull(this.loggers, logger);
        logger.destroy();
        for (const item of this.loggers) {
            if (item.isChildOf(logger)) item.destroy();
        }
    }

    get(hash: string) {
        for (const logger of this.loggers) {
            if (logger.hash === hash) return logger;
        }
    }
}
export const loggerPool = LoggerPool.INSTANCE;


export declare interface Logger {
    on(eventName: 'log.raw', listener: (tag: string, messages: unknown[]) => void): this;
    on(eventName: 'log', listener: (content: string) => void): this;
}
export class Logger extends EventBus implements LoggerLike {
    readonly name: string;
    readonly parent?: Logger;
    readonly hash: string;
    constructor(name: string, parent?: Logger) {
        super();
        if (parent?.destroyed) throw new ReferenceError();
        this.name = name;
        this.parent = parent;
        this.hash = createHash('sha256')
            .update(this.names.value)
            .update(
                new Error().stack
                    ?.split('\n')[2].trim()
                    .split(' ')[1]
                    .split(/[\\\/]/).pop() ?? '^'
            )
            .digest('hex')
            .slice(0, 5);
    }

    inPool(): this {
        loggerPool.push(this);
        return this;
    }
    destroy() {
        super.destroy();
        loggerPool.pull(this);
    }

    child(name: string): Logger {
        return new Logger(name, this);
    }
    isChildOf(logger: Logger): boolean {
        return this.parents().some(parent => parent === logger);
    }
    parents(): Logger[] {
        return this.parent ? [ ...this.parent.parents(), this.parent ] : [];
    }
    families(): Logger[] {
        return [ ...this.parents(), this ];
    }

    private static readonly TAGS = {
        DEBUG: [ chalk.italic('DEBUG'), undefined ],
        INFO: [ chalk.cyan('INFO'), undefined ],
        WARN: [ chalk.yellow('WARN'), chalk.yellowBright ],
        ERROR: [ chalk.red('ERROR'), chalk.redBright ],
        FATAL: [ chalk.white.bgRed('FATAL'), chalk.redBright ],
    } as const;
    names = lazy(() => this.families().map(logger => `[${logger.name}]`).join(' '));
    private log0(tag: string, tint: ChalkInstance | undefined, ...messages: unknown[]) {
        this.emit('log.raw', tag, messages);
        const date = new Date();
        const hh = date.getHours().toString().padStart(2, '0');
        const mm = date.getMinutes().toString().padStart(2, '0');
        const ss = date.getSeconds().toString().padStart(2, '0');
        const ms = date.getMilliseconds().toString().padStart(3, '0');
        const time = chalk.gray(`${hh}:${mm}:${ss}.${ms}`);
        const modifier = `${time} ${tag} ${this.names.value} `;
        const indent = ' '.repeat(colorless(modifier).length);
        const content = messages.map(logify).join(' ').replaceAll('\n', '\n' + indent);
        let log = modifier + content;
        if (tint) log = log
            .split('\n')
            .map(line => tint(line))
            .join('\n');
        this.emit('log', log);
    }
    debug(...messages: unknown[]) {
        this.log0(...Logger.TAGS.DEBUG, ...messages);
    }
    info(...messages: unknown[]) {
        this.log0(...Logger.TAGS.INFO, ...messages);
    }
    warn(...messages: unknown[]) {
        this.log0(...Logger.TAGS.WARN, ...messages);
    }
    error(...messages: unknown[]) {
        this.log0(...Logger.TAGS.ERROR, ...messages);
    }
    fatal(...messages: unknown[]) {
        this.log0(...Logger.TAGS.FATAL, ...messages);
    }
}
export const globalLogger = new Logger('BridGeo').inPool();


// noinspection SpellCheckingInspection
export function logify(object: unknown): string {
    switch (typeof object) {
        case 'string':
        case 'bigint':
        case 'number':
        case 'boolean':
        case 'symbol':
            return object.toString();
        case 'object':
            if (object === null) return 'null';
            if (object instanceof Error) return object.stack ?? String(object);
            break;
        case 'undefined':
            return 'undefined';
    }
    return util.inspect(object, { colors: true });
}
export function colorless(string: string): string {
    return string.replace(/\u001B\[\d+m/g, '');
}
