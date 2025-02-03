import chalk from 'chalk';
import { EventEmitter } from "events";
import fs from "fs";
import _ from "lodash";
import * as paths from "path";
import util from "util";

import { lazy } from "./functions.js";

const loggerOutput = './bridgeo-data/logs/' + new Date()
    .toISOString()
    .replaceAll('/', '-')
    .replaceAll(':', '_');
let isCreatedLogDir = false;
function createLazyWriteStream(path) {
    if (!isCreatedLogDir) isCreatedLogDir = fs.mkdirSync(loggerOutput, { recursive: true });
    return lazy(() => fs.createWriteStream(path, { flags: 'a', encoding: 'utf8' }));
}

const loggerEmitter = new EventEmitter();
const loggerPool = [];
loggerPool.push = function (...items) {
    const transferred = [ 'log.raw', 'log', 'log_styled.raw', 'log_styled', ];
    for (let logger of items) {
        transferred.forEach(event => logger.on(event, (...args) =>
            loggerEmitter.emit(event, ...args, logger)));
        logger.path = paths.resolve(loggerOutput, (logger.names().join() + '@' + logger.id)
            .replaceAll(':', '_')
            .replaceAll('.', '-') + '.log'
        );
        logger.output = createLazyWriteStream(logger.path);
        logger.on('log', messages => logger.output.value.write(clear(messages) + '\n'));
    }
    return Array.prototype.push.call(this, ...items);
};

class Logger extends EventEmitter {
    constructor(name, parent) {
        super();
        this.name = name;
        this.parent = parent;
        this.id = new Error().stack
            .split('\n')[2].trim()
            .split(' ')[1]
            .split(/[\\\/]/).pop();
    }
    inPool() {
        if (this.#destroyed) throw new ReferenceError();

        if (this in loggerPool) return this;
        loggerPool.push(this);
        return this;
    }
    #destroyed = false;
    destroy() {
        if (this in loggerPool) _.pull(loggerPool, this);
        this.#destroyed = true;
    }

    child(name) {
        if (this.#destroyed) throw new ReferenceError();

        const kid = new Logger(name, this);
        kid.id = new Error().stack
            .split('\n')[2].trim()
            .split(' ')[1]
            .split(/[\\\/]/).pop();
        return kid;
    }
    isChildOf(parent) {
        if (this.#destroyed) throw new ReferenceError();

        if (this.parent === parent) return true;
        if (!this.parent) return false;
        return this.parent.isChildOf(parent);
    }
    names() {
        if (this.#destroyed) throw new ReferenceError();

        function find(logger, names) {
            if (!logger.parent) return names;
            logger.parent.name && names.unshift(logger.parent.name);
            return find(logger.parent, names);
        }
        return find(this, [ this.name ]);
    }

    static logStringify = messages => messages.map(shown).join(' ');
    log(...messages) {
        if (this.#destroyed) throw new ReferenceError();

        const stringed = Logger.logStringify(messages);

        this.emit('log.raw', messages);
        this.emit('log', stringed);
        return stringed;
    }
    retraction = true;
    styledLog(tag, ...messages) {
        let showTime = new Date();
        showTime = chalk.grey(`${
            showTime.getHours().toString().padStart(2, '0')}:${
            showTime.getMinutes().toString().padStart(2, '0')}:${
            showTime.getSeconds().toString().padStart(2, '0')}.${
            showTime.getUTCMilliseconds().toString().padStart(3, '0')}`);
        // new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(11, -1)
        const showTag = tag;
        const showName = this.names().map(name => `[${name}]`).join(' ');

        const modifiers = { time: showTime, tag: showTag, name: showName };
        this.emit('log_styled.raw', messages, modifiers);

        const show = [ showTime, showTag, showName ].filter(Boolean).join(' ');
        let logged = Logger.logStringify([ show, ...messages ]);
        if (this.retraction) logged = logged.replaceAll('\n', '\n' + ' '.repeat(clear(show).length + 1));
        this.log(logged);
        this.emit('log_styled', logged, modifiers);

        return logged;
    }

    debug(...message) {
        return this.styledLog(chalk.italic('DEBUG'), ...message);
    }
    info(...message) {
        return this.styledLog(chalk.cyan('INFO'), ...message);
    }
    warn(...message) {
        return this.styledLog(chalk.yellow('WARN'), ...message);
    }
    error(...message) {
        return this.styledLog(chalk.red('ERROR'), ...message);
    }
    fatal(...message) {
        return this.styledLog(chalk.white.bgRed('FATAL'), ...message);
    }

    // 这是字段, WebStorm高亮不是蓝色, 不好看...
    // debug = this.styledLog.bind(this, chalk.italic('DEBUG'));
    // info = this.styledLog.bind(this, chalk.cyan('INFO'));
    // warn = this.styledLog.bind(this, chalk.yellow('WARN'));
    // error = this.styledLog.bind(this, chalk.red('ERROR'));
    // fatal = this.styledLog.bind(this, chalk.bgRed('FATAL'));
}

/** @return {string} */
function shown(object) {
    if (object === null) return 'null';
    if (object === undefined) return 'undefined';
    if (typeof object === 'string') return object;
    if (typeof object === 'bigint') return object.toString() + 'n';
    if (
        typeof object === 'number'
        || typeof object === 'boolean'
        || typeof object === 'symbol'
    ) return object.toString();

    if (object instanceof Error)
        return object.stack ?? String(object);

    return util.inspect(object, { colors: true });
}
function clear(string) {
    return string.replace(/\u001B\[\d+m/g, '');
}

const globalLogger = new Logger('BridGeo').inPool();
const $log = createLazyWriteStream(paths.resolve(loggerOutput, '$.log'));
loggerEmitter.on('log', messages => $log.value.write(clear(messages) + '\n'));

export {
    loggerOutput, loggerPool, loggerEmitter,
    globalLogger, Logger,
    shown, clear
};
