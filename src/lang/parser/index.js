import { parse } from './parser.js';
import { createTokenizer, tokenize } from './tokenizer.js';

export default {
    parse(input, tolerant = false) {
        const commentRanges = [];

        return {
            ast: parse(input, {
                tolerant,
                onComment: commentRanges
            }),
            commentRanges
        };
    },

    createTokenizer,
    tokenize
};
