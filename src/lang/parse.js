/* istanbul ignore file */
import { writeFileSync } from 'fs';
import jison from '@lahmatiy/jison';
import * as grammar from './grammar.js';
import buildParsers from './parse-raw.js';

const strictParser = new jison.Parser(grammar);

export const parser = buildParsers(strictParser);
export function generateModule() {
    return strictParser
        .generateModule('esm')
        .replace(/\\r\\n\?\|\\n/g, '\\n|\\r\\n?|\\u2028|\\u2029')
        .replace(/\\r\?\\n\?/g, '\\n|\\r|\\u2028|\\u2029|$')
        .replace('new Parser()', '(' + buildParsers + ')(new Parser)');
}
export function bake() {
    writeFileSync(import.meta.url, generateModule());
}
