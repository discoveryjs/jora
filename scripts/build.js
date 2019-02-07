const path = require('path');
const fs = require('fs');
const { strict } = require('../src/parser');
const patch = fs.readFileSync(path.join(__dirname, '../src/parser-patch.js'), 'utf8');

console.log(strict.generateModule({
    moduleName: 'strictParser'
}));
console.log(patch.replace(/^(.|\s)*?module\.exports = /, '\n'));
console.log('module.exports = patchParsers(strictParser);');
