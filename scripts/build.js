const path = require('path');
const fs = require('fs');
const { strict, tolerant } = require('../src/parser');
const patch = fs.readFileSync(path.join(__dirname, '../src/parser-patch.js'), 'utf8');

console.log(strict.generateModule({
    moduleName: 'strictParser'
}));
console.log(tolerant.generateModule({
    moduleName: 'tolerantParser'
}));
console.log(patch.replace(/^(.|\s)*?module\.exports = /, '\n'));
console.log(`\
patchParsers(strictParser, tolerantParser);
module.exports = strictParser;
strictParser.strict = strictParser;
strictParser.tolerant = tolerantParser;
`);
