import readline from "readline";

import { relays } from "./relay.js";
import { loggerEmitter } from "./utils/js/logger.js";

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
rl.prompt();
function initTerminal() {
    loggerEmitter.on('log', (messages, logger) => {
        // noinspection JSCheckFunctionSignatures
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        console.log(messages);
        rl.prompt(true);
    });

    rl.on('line', input => {
        rl.prompt(true);
    });
    rl.on('close', () => {
        relays.forEach(relay => relay.close('BridGeo Close'));
        process.exit(0);
    });
}

function registerCommand(command, logger) {
}
function unregisterCommand(command, logger) {
}

class Command {
    #prefix;
    constructor(prefix) {
        this.#prefix = prefix;
    }
}


export { initTerminal };
