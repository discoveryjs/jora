/* istanbul ignore file */
const fs = require('fs');
const { Parser } = require('@lahmatiy/jison');
const grammar = require('./grammar');
const buildParsers = require('./parse-raw');
const strictParser = new Parser(grammar);

module.exports = buildParsers(strictParser);
module.exports.generateModule = function() {
    return strictParser
        .generateModule({ moduleName: 'module.exports' })
        .replace(/\\r\\n\?\|\\n/g, '\\n|\\r\\n?|\\u2028|\\u2029')
        .replace(/\\r\?\\n\?/g, '\\n|\\r|\\u2028|\\u2029|$')
        .replace('new Parser', '(' + buildParsers + ')(new Parser)');
};
module.exports.bake = function() {
    fs.writeFileSync(__filename, module.exports.generateModule());
};
