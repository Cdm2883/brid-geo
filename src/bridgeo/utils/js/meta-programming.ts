import { defaultTag } from "@/bridgeo/utils/js/template-literals";


export function indent(space: number, code = ''): string {
    return code
        .split('\n')
        .map(line => '    '.repeat(space) + line)
        .join('\n');
}
export function line(space: number) {
    return function (strings: TemplateStringsArray, ...values: unknown[]) {
        return indent(space) + defaultTag(strings, ...values) + '\n';
    };
}
export function enter(strings: TemplateStringsArray, ...values: unknown[]) {
    return defaultTag(strings, ...values) + '\n';
}

export function removeComments(lines: string) {
    return lines
        .split('\n')
        .map(line => line
            .replace(/\/\/.*$/gm, '')
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .trim()
        )
        .join('\n');
}

export function trimIndent(code: string) {
    let minIndent = Number.MAX_VALUE;
    for (const line of code.split('\n')) {
        if (line.trim() === '') continue;
        let currentIndent = 0;
        for (const char of line) {
            if (char !== ' ') break;
            currentIndent++;
        }
        minIndent = Math.min(minIndent, currentIndent);
        if (minIndent === 0) break;
    }
    if (minIndent > 0) code = code
        .split('\n')
        .map(line => line.slice(minIndent))
        .join('\n');
    return code;
}
export function trimCode(code: string): string {
    return trimIndent(code).trim() + '\n';
}
