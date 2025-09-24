import { parse } from './parser.js';
import { createTokenizer } from './tokenizer.js';

export default {
    parse(source, tolerant = false) {
        return {
            ast: parse(createTokenizer(source, tolerant)),
            commentRanges: []
        };
    },

    *tokenize(source, tolerant = false) {
        const tokenizer = createTokenizer(source, tolerant);
        let token;

        do {
            token = tokenizer.nextToken();
            yield token;
        } while (token.type !== 57); // TOKEN_EOF
    }
};
