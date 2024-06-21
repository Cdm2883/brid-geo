export function replaceAt(string: string, index: number, replacement: string) {
    return string.slice(0, index) + replacement + string.slice(index + 1);
}
export function removeAt(string: string, index: number) {
    return replaceAt(string, index, '');
}

export function mergeDuplicate(string: string, duplicate: string) {
    if (duplicate.length === 0) return string;
    const regex = new RegExp(`(${duplicate})+`, 'g');
    return string.replace(regex, duplicate);
}
