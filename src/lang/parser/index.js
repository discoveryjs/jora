/**
 * New parser integration wrapper
 * Provides compatibility with the existing jison parser interface
 */

import { Parser } from './parser.js';
import { Tokenizer } from './tokenizer.js';
import { TOKEN_EOF } from './tokens.js';

// Create a compatible parser interface
const parser = {
    parse(source, tolerantMode = false) {
        try {
            const tokenizer = new Tokenizer(source, tolerantMode);
            const joraParser = new Parser(tokenizer);
            const ast = joraParser.parse();

            return {
                ast: ast,
                error: null
            };
        } catch (error) {
            if (tolerantMode) {
                // In tolerant mode, return a placeholder AST with error info
                return {
                    ast: {
                        type: 'Block',
                        definitions: [],
                        body: {
                            type: 'Literal',
                            value: null
                        }
                    },
                    error: error
                };
            }
            throw error;
        }
    },

    tokenize(source, tolerantMode = false) {
        // For backward compatibility, provide tokenization
        // This is used by the debug/introspection features
        const tokenizer = new Tokenizer(source, tolerantMode);
        const tokens = [];

        let token;
        do {
            token = tokenizer.nextToken();
            tokens.push({
                type: token.name,  // Use token.name for compatibility with legacy interface
                value: token.value,
                offset: token.offset
            });
        } while (token.type !== TOKEN_EOF);

        return tokens;
    }
};

export default parser;
