import { Command, CommanderError } from "commander";

import { Commander, CommanderMetadata, CommanderSession } from "@/bridgeo/plugin/command";
import { binding } from "@/bridgeo/utils/js/functions";

export class CliCommander implements Commander {
    static parseArguments(input: string): string[] {
        const regex = /(?:[^\s"]+|"[^"]*")+/g;
        const matches = input.match(regex);
        return matches ? matches.map(arg => arg.replace(/(^"|"$)/g, '')) : [];
    }

    command: CommanderMetadata = {
        name: '',
        description: '',
        hints: '',
    };
    program!: Command;
    constructor(name: string | string[], block?: (program: Command, helper: CliCommander) => void) {
        this.command.name = name;
        if (block) this.describe(block);
    }
    describe(block: (program: Command, helper: this) => void): this {
        const program = this.program ?? new Command().exitOverride();
        block(program, this);
        this.command.description = program.summary() || program.description();
        this.command.hints = program.helpInformation();
        this.program = program;
        return this;
    }

    session!: CommanderSession;
    callbacks: ((program: Command, session: CommanderSession) => void)[] = [];
    onCommand(listener: typeof this.callbacks[number]): this {
        this.callbacks.push(listener);
        return this;
    }

    catches: ((e: unknown, helper: this) => boolean | void)[] = [];
    onError(listener: typeof this.catches[number]): this {
        this.catches.push(listener);
        return this;
    }
    
    onCommandArgs(raw: string, session: CommanderSession) {
        this.session = session;
        this.program.configureOutput({
            writeOut: binding(session.output).info,
            writeErr: binding(session.output).error,
        });
        const name = typeof this.command.name === 'string' ? this.command.name : this.command.name.join('|');
        const args = CliCommander.parseArguments(raw);
        try {
            this.program.parse([ process.argv[0], name, ...args ]);
            this.callbacks.forEach(callback => callback(this.program, session));
        } catch (e) {
            if (e instanceof CommanderError) return;
            let caught = false;
            this.catches.forEach(callback => caught = caught /* 注意这里会短路 */ || (callback(e, this) ?? false));
            if (!caught) session.output.error(e);
        }
    }
}
