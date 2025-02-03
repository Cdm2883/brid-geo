// eslint-disable-next-line simple-import-sort/imports
import { CHECK } from "./type-check.js";
import { globalLogger } from "./logger.js";

function isAsyncFunction(func) {
    return func?.constructor.name === 'AsyncFunction'
        || func?.[Symbol.toStringTag] === 'AsyncFunction';
}

async function awaitable(func, context = undefined, ...args) {
    if (!(func instanceof Function)) return func;

    if (isAsyncFunction(func)) return await func.call(this, ...args);

    const result = func.call(this, ...args);
    return result instanceof Promise ? await result : result;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Kotlin我想你了 :(
function lazy(func, readonly = false) {
    CHECK.IsNotDefined({ func });

    let initialed = false;
    let value;
    // return () => {
    //     if (initialed) return value;
    //     initialed = true;
    //     return value = func();
    // };
    return {
        get value() {
            if (initialed) return value;
            initialed = true;
            return value = func();
        },
        set value(newValue) {
            if (readonly) return false;
            value = newValue;
            return true;
        },
    };
}

function range(min, max) {
    CHECK.IsNotDefined({ min, max });

    return Array.from(new Array(max - min), (_, i) => i + min);
}

function trying(target, fallback = globalLogger.error.bind(globalLogger)) {
    if (typeof target !== 'function')
        target = () => target;
    if (typeof fallback !== 'function')
        fallback = _e => fallback;

    if (isAsyncFunction(target) || isAsyncFunction(fallback)) return (async () => {
        try {
            return await target();
        } catch (e) {
            return await fallback(e);
        }
    })();

    try {
        return target();
    } catch (e) {
        return fallback(e);
    }
}

function setIntervalUntilError(callback, ms, ...args) {
    CHECK.IsNotDefined({ callback });

    const catching = isAsyncFunction(callback)
        ? async id => {
            try {
                await callback(...args);
            } catch (e) {
                clearInterval(id());
            }
        }
        : id => {
            try {
                callback(...args);
            } catch (e) {
                clearInterval(id());
            }
        };
    const id = setInterval(catching, ms, () => id);
    return id;
}

function betterArray(array = []) {
    const better = { __proto__: array };

    // https://github.com/tc39/proposal-relative-indexing-method
    better.at = function (n) {
        n = Math.trunc(n) || 0;
        if (n < 0) n += this.length;
        if (n < 0 || n >= this.length) return undefined;
        return this[n];
    };

    better.last = function () {
        return this[this.length - 1];
    };

    better.rest = function (count) {
        return this.slice(this.length - count);
    };

    better.roll = function (length = 1) {
        if (this.length <= 0) return this;
        if (length > 0) for (;--length;) {
            this.push(this[0]);
            this.shift();
        }
        if (length < 0) for (;++length;) {
            this.unshift(this[0]);
            this.pop();
        }
        return this;
    };

    better.looping = 0;
    Object.defineProperty(better, 'loop', {
        get: () => better.looping++ % better.length,
        set: value => better.looping = value
    });

    better.max = function (length) {
        if (this.length <= length) return this;
        return this.splice(0, this.length - length);
    };

    return better;
}

export { isAsyncFunction, awaitable, sleep, lazy, range, trying, setIntervalUntilError, betterArray };
