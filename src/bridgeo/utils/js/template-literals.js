function defaultTag(strings, ...values) {
    let result = "";
    for (let i = 0; i < strings.length; i++) {
        result += strings[i];
        if (i < values.length)
            result += values[i];
    }
    return result;
}

const tagGenerators = {
    prefix: prefix => (strings, ...values) => prefix + defaultTag(strings, ...values)
};

export { defaultTag, tagGenerators };
