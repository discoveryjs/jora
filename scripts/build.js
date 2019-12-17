const path = require('path');
const fs = require('fs');
const { version } = require('../package.json');
const { strict } = require('../src/parser');
const patch = fs.readFileSync(path.join(__dirname, '../src/parser-patch.js'), 'utf8');

fs.writeFileSync(path.join(__dirname, '../dist/parser.js'), [
    strict.generateModule({ moduleName: 'strictParser' }),
    patch.replace(/^(.|\s)*?module\.exports = /, '\n'),
    'module.exports = patchParsers(strictParser);'
].join('\n'), 'utf8');

fs.writeFileSync(path.join(__dirname, '../dist/package.json'), JSON.stringify({ version }), 'utf8');
