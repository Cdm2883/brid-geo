import { readFileSync } from "fs";

// import packageJson from "../../../../package.json" assert { type: 'json' };
const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));

const version = packageJson.version;

export { packageJson, version };
