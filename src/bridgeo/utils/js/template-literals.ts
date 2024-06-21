import { trimIndent } from "@/bridgeo/utils/js/meta-programming";

export function defaultTag(strings: TemplateStringsArray, ...values: unknown[]) {
    let result = '';
    for (let i = 0; i < strings.length; i++) {
        result += strings[i];
        if (i < values.length)
            result += values[i];
    }
    return result;
}

/**
 * ```ts
 * {
 *     trimTemplate`
 *     awa
 *     121`  // 'awa\n121'
 * }
 * ```
 *
 * ```ts
 * {
 *     trimTemplate`ovo
 *     awa
 *     121`  // 'ovo\n    awa\n    121'
 * }
 * ```
 *
 * ```ts
 * {
 *     {
 *         trimTemplate`
 *         awa
 *         `  // 'awa'
 *     }
 * }
 * ```
 */
export function trimTemplate(...args: Parameters<typeof defaultTag>) {
    let string = defaultTag(...args);

    if (string.charAt(0) === '\n') string = string.slice(1);

    const split = string.split('\n');
    if (split.at(-1)!.trim() === '') string = string.slice(0, -1 * split.at(-1)!.length - 1);

    return trimIndent(string);
}
