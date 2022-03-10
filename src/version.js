import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export const { version } = require('../package.json');
export function generateModule() {
    return 'module.exports = ' + JSON.stringify(module.exports, null, 4) + ';';
}
export function bake() {
    fs.writeFileSync(import.meta.url, module.exports.generateModule());
}
