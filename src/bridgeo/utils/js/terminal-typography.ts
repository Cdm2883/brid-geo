import { colorless } from "@/bridgeo/utils/js/logger";

export function typeCenter(text: string, columns: number) {
    const padding = columns / 2 - colorless(text).length / 2;
    return ' '.repeat(padding) + text.padEnd(padding, ' ');
}
