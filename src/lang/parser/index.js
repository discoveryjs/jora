import { parse } from './parser.js';
import { createTokenizer } from './tokenizer.js';

function* tokenize(source, tolerant = false) {
    const nextToken = createTokenizer(source, tolerant);
    let token;

    while (token = nextToken()) {
        yield token;
    }
}

export default {
    parse(source, tolerant = false) {
        return {
            ast: parse([...tokenize(source, tolerant)]),
            commentRanges: []
        };
    },

    tokenize
};
