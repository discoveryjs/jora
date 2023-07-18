/* c8 ignore start */
const jison = require('@lahmatiy/jison');
const grammar = require('./grammar.cjs');
const parserPatch = require('./parse-patch.cjs');

const strictParser = new jison.Parser(grammar);

// temp workaround
if (!Object.hasOwn) {
    Object.hasOwn = (subject, key) => Object.prototype.hasOwnProperty.call(subject, key);
}
if (!String.prototype.replaceAll) {
    String.prototype.replaceAll = function(pattern, replacement) {
        return typeof replacement === 'function'
            ? this.split(pattern).map((s, idx, ar) =>
                idx !== 0 ? replacement(pattern, ar.slice(0, idx).join('').length, String(this)) + s : s
            ).join('')
            : this.split(pattern).join(replacement);
    };

    console.log('asdasdasd'.replaceAll('s', (...a) => console.log(a) || 'x'));
}

module.exports = function generateModule() {
    return strictParser
        .generateModule('esm', { packTable: 'advanced' })
        .replace(/\\r\\n\?\|\\n/g, '\\n|\\r\\n?|\\u2028|\\u2029')
        .replace(/\\r\?\\n\?/g, '\\n|\\r|\\u2028|\\u2029|$')
        .replace('new Parser()', '(' + parserPatch + ')(new Parser)');
};
