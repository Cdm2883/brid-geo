const vector2string = vec => vec ? Object.values(vec).join(' ') : '';
const string2vector = (str, ...keys) => {
    if (!str) return {};

    let vector = {};
    let strings = str.split(' ');
    for (let i = 0; i < keys.length; i++) {
        let value = strings[i];
        let num = Number(value);
        if (!Number.isNaN(num)) value = num;
        vector[keys[i]] = value;
    }
    return vector;
};
const string2xyz = str => string2vector(str, 'x', 'y', 'z');
const string2xz = str => string2vector(str, 'x', 'z');

export {
    vector2string,
    string2vector, string2xyz, string2xz
};
