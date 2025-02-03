import { readFileSync } from "fs";

function readPacket(name) {
    const path = `./src/bridgeo/packets/${name}.json`;
    const file = readFileSync(path, 'utf8');
    return JSON.parse(file);
}

let globalId = {
    i: 114514,
    get new() { return ++this.i; }
};

export { readPacket, globalId };
