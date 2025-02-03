import { EventEmitter } from "events";

class BetterEventEmitter extends EventEmitter {
    emit(eventName, ...args) {
        if (eventName !== '_emit') this.emit('_emit', eventName, ...args);
        return super.emit(eventName, ...args);
    }
}

export default BetterEventEmitter;
