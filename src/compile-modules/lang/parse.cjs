/* c8 ignore start */
const jison = require('@lahmatiy/jison');
const grammar = require('./grammar.cjs');
const parserPatch = require('./parse-patch.cjs');

const strictParser = new jison.Parser(grammar);

module.exports = function generateModule() {
    return strictParser
        .generateModule('esm')
        .replace(/\\r\\n\?\|\\n/g, '\\n|\\r\\n?|\\u2028|\\u2029')
        .replace(/\\r\?\\n\?/g, '\\n|\\r|\\u2028|\\u2029|$')
        .replace('export let', 'let')
        .replace('new Parser()', '(' + parserPatch + ')(new Parser)');
};
