import { logify } from "@/bridgeo/utils/js/logger";

export const SS = '§';

export const colors: Record<string, number> = {
    '0': 0x000000,  // black
    '1': 0x0000AA,  // dark_blue
    '2': 0x00AA00,  // dark_green
    '3': 0x00AAAA,  // dark_aqua
    '4': 0xAA0000,  // dark_red
    '5': 0xAA00AA,  // dark_purple
    '6': 0xFFAA00,  // gold
    '7': 0xAAAAAA,  // gray
    '8': 0x555555,  // dark_gray
    '9': 0x5555FF,  // blue (5455FF)
    'a': 0x55FF55,  // green (55FF56)
    'b': 0x55FFFF,  // aqua
    'c': 0xFF5555,  // red
    'd': 0xFF55FE,  // light_purple
    'e': 0xFFFF55,  // yellow
    'f': 0xFFFFFF,  // white
    'g': 0xEECF15,  // minecoin_gold
    'h': 0xE3D4D1,  // material_quartz
    'i': 0xCECACA,  // material_iron
    'j': 0x443A3B,  // material_netherite
    // 'm': 0x971607,  // material_redstone
    // 'n': 0xB4684D,  // material_copper
    'p': 0xDEB12D,  // material_gold
    'q': 0x47A036,  // material_emerald
    's': 0x2CBAA8,  // material_diamond
    't': 0x21497B,  // material_lapis
    'u': 0x9A5CC6,  // material_amethyst
};
export const extras: Record<string, string> = {
    'k': '\x1b[5m',  // obfuscated
    'l': '\x1b[1m',  // bold
    'm': '\x1b[9m',  // strikethrough
    'n': '\x1b[4m',  // underline
    'o': '\x1b[3m',  // italic
    'r': '\x1b[0m',  // clear
};

export function toAnsiColorFormat(text: string): string {
    if (!text.includes(SS)) return text;
    const regex = new RegExp(`${SS}[a-z0-9]`, 'g');
    const hex2ansi = (hex: number): string => {
        const r = (hex >> 16) & 0xff;
        const g = (hex >> 8) & 0xff;
        const b = hex & 0xff;
        return `\x1b[38;2;${r};${g};${b}m`;
    };
    const formatted = text.replace(regex, match => {
        const code = match[1];
        if (colors[code]) return hex2ansi(colors[code]);
        return extras[code] || SS + code;
    });
    return formatted + extras.r;
}

const mChalkMapping = {
    black: '0',
    dark_blue: '1',
    dark_green: '2',
    dark_aqua: '3',
    dark_red: '4',
    dark_purple: '5',
    gold: '6',
    gray: '7',
    dark_gray: '8',
    blue: '9',
    green: 'a',
    aqua: 'b',
    red: 'c',
    light_purple: 'd',
    yellow: 'e',
    white: 'f',
    minecoin_gold: 'g',
    material_quartz: 'h',
    material_iron: 'i',
    material_netherite: 'j',
    // material_redstone: 'm',
    // material_copper: 'n',
    material_gold: 'p',
    material_emerald: 'q',
    material_diamond: 's',
    material_lapis: 't',
    material_amethyst: 'u',
};
export type MChalkInstance = {
    [color in keyof typeof mChalkMapping]: MChalkInstance;
} & {
    (...text: string[]): string;
    /* k */ obfuscated: MChalkInstance;
    /* l */ bold: MChalkInstance;
    /* m */ strikethrough: MChalkInstance;
    /* n */ underline: MChalkInstance;
    /* o */ italic: MChalkInstance;
    /* r */ clear: MChalkInstance;
};

/* eslint-disable @typescript-eslint/ban-ts-comment,@typescript-eslint/ban-types */
// noinspection SpellCheckingInspection
export const mchalk: MChalkInstance = new Proxy(
    // @ts-expect-error
    text => text.replaceAll('&', SS),
    {
        get(_target: MChalkInstance, p: string) {
            const coder = (key: string) => ({
                ...mChalkMapping,
                obfuscated: 'k',
                bold: 'l',
                strikethrough: 'm',
                underline: 'n',
                italic: 'o',
                clear: 'r',
            })[key];
            const handler: ProxyHandler<Function> = {
                apply: (target: Function, thisArg: unknown, argArray: string[]) =>
                    Reflect.apply(target, thisArg, argArray) + argArray.map(logify).join(' ') + SS + 'r',
                get(target: Function, p: string | symbol, receiver: unknown) {
                    const code = coder(p as string);
                    if (!code) return Reflect.get(target, p, receiver);
                    return build(target() + SS + code);
                }
            };
            const build = (string: string) => new Proxy((() => {
                const func = () => string;
                // @ts-ignore
                func[Symbol.toPrimitive] = () => string;
                func[Symbol.toStringTag] = string;
                func.valueOf = () => string;
                return func;
            })(), handler);
            return build(SS + coder(p) ?? p);
        }
    }
);
