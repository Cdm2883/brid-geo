import EventEmitter from "node:events";

export default class EventBus extends EventEmitter {
    enabled = true;
    #destroyed = false;
    get destroyed() { return this.#destroyed; }
    destroy() {
        this.#destroyed = true;
        this.enabled = false;
    }

    constructor() {
        super({ captureRejections: true });
        this.setMaxListeners(Infinity);
    }
    emit(eventName: string | symbol, ...args: unknown[]) {
        if (this.#destroyed || !this.enabled) return false;
        if (eventName !== '*') this.emit('*', eventName, ...args);
        return super.emit(eventName, ...args);
    }

    forward(
        destination: EventEmitter,
        eventFrom: string | symbol = '*',
        eventTo: string | symbol = eventFrom,
        processor: (...args: unknown[]) => unknown[] = (...args) => args
    ) {
        const listener = (...args: unknown[]) => {
            if (destination instanceof EventBus) {
                if (destination.destroyed) {
                    destination.off(eventFrom, listener);
                    return;
                }
                if (!destination.enabled) {
                    return;
                }
            }

            if (eventTo === '*') {
                const eventName = args[0] as string;
                const eventArgs = args.slice(1);
                destination.emit(eventName, ...processor(...eventArgs));
            } else {
                destination.emit(eventTo, ...processor(...args));
            }
        };
        this.on(eventFrom, listener);
    }
}
