/* c8 ignore start */
import jison from '@lahmatiy/jison';
import * as grammar from './grammar.js';
import parserPatch from './parse-patch.js';

const strictParser = new jison.Parser(grammar);

export default function generateModule() {
    return strictParser
        .generateModule('esm')
        .replace(/\\r\\n\?\|\\n/g, '\\n|\\r\\n?|\\u2028|\\u2029')
        .replace(/\\r\?\\n\?/g, '\\n|\\r|\\u2028|\\u2029|$')
        .replace('export let', 'let')
        .replace('new Parser()', '(' + parserPatch + ')(new Parser)');
};
