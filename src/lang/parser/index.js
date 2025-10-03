import { parse } from './parser.js';
import { createTokenizer, tokenize } from './tokenizer.js';

export default {
    parse(input, tolerant = false) {
        return {
            ast: parse(input, tolerant),
            commentRanges: []
        };
    },

    createTokenizer,
    tokenize
};
