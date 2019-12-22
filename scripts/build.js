const path = require('path');
const fs = require('fs');
const parser = require('../src/parser/index.js');

fs.writeFileSync(
    path.join(__dirname, '../dist/parser.js'),
    parser.generateModule({ moduleName: 'module.exports' }),
    'utf8'
);
