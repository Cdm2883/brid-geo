// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isAsyncFunction(func: any) {
    return func?.constructor.name === 'AsyncFunction'
        || func?.[Symbol.toStringTag] === 'AsyncFunction';
}

export function sleep(ms: number) {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
}

// https://youtrack.jetbrains.com/issue/WEB-67449/
type Lazy<T, R extends boolean> = R extends true
    ? { value: T }
    : { readonly value: T };
export function lazy<T, R extends boolean>(
    initializer: () => T,
    settable: R = false as R
): Lazy<T, R> {
    let initialed = false;
    let value: T;
    return {
        get value() {
            if (initialed) return value;
            initialed = true;
            return value = initializer();
        },
        set value(newValue) {
            if (!settable) return;
            value = newValue;
        },
    };
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function setIntervalUntilError(callback: Function, ms: number, ...args: unknown[]) {
    type IdReceiver = () => NodeJS.Timeout;
    const catching = isAsyncFunction(callback)
        ? async (id: IdReceiver) => {
            try {
                await callback(...args);
            } catch (e) {
                clearInterval(id());
            }
        }
        : (id: IdReceiver) => {
            try {
                callback(...args);
            } catch (e) {
                clearInterval(id());
            }
        };
    const id: NodeJS.Timeout = setInterval(catching, ms, () => id);
    return id;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mixinsObject<T, R extends any[]>(source: T, objects: R, exclude: (string | symbol)[] = []): T & R[number] {
    for (const mix of objects) {
        for (const name of Object.getOwnPropertyNames(mix)) {
            if (exclude.includes(name)) continue;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (source as any)[name] = mix[name];
        }
    }
    return source;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mixinsClass<T>(clazz: T, classes: any[], exclude: (string | symbol)[] = []) {
    for (const mix of classes) {
        for (const name of Object.getOwnPropertyNames(mix.prototype)) {
            if (exclude.includes(name)) continue;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (clazz as any).prototype[name] = mix.prototype[name];
        }
    }
    return clazz;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mixinsClassInstance<T>(clazz: T, objects: any[], exclude: (string | symbol)[] = []) {
    for (const mix of objects) {
        for (const name of Object.getOwnPropertyNames(mix)) {
            if (exclude.includes(name)) continue;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (clazz as any).prototype[name] = mix[name];
        }
    }
    return clazz;
}
