/**
 * New parser integration wrapper
 * Provides compatibility with the existing jison parser interface
 */

import { Parser } from './parser.js';
import { createTokenizer } from './tokenizer.js';

// Create a compatible parser interface
export default {
    parse(source, tolerant = false) {
        const tokenizer = createTokenizer(source, tolerant);
        const joraParser = new Parser(tokenizer);

        return {
            ast: joraParser.parse(),
            commentRanges: []
        };
    },

    *tokenize(source, tolerant = false) {
        const tokenizer = createTokenizer(source, tolerant);

        while (!tokenizer.done) {
            yield tokenizer.nextToken();
        }
    }
};
