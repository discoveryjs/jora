/* istanbul ignore file */
const fs = require('fs');
const { Parser } = require('jison');
const grammar = require('./grammar');
const buildParsers = require('./parse-raw');
const strictParser = new Parser(grammar);

module.exports = buildParsers(strictParser);
module.exports.generateModule = function() {
    return strictParser
        .generateModule({ moduleName: 'module.exports' })
        .replace('new Parser', '(' + buildParsers + ')(new Parser)');
};
module.exports.bake = function() {
    return fs.writeFileSync(__filename, module.exports.generateModule());
};
