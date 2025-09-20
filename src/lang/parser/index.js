/**
 * New parser integration wrapper
 * Provides compatibility with the existing jison parser interface
 */

import { JoraParser } from './parser.js';
import { Tokenizer } from './tokenizer.js';

// Create a compatible parser interface
const parser = {
    parse(source, tolerantMode = false) {
        try {
            const joraParser = new JoraParser({ tolerant: tolerantMode });
            const ast = joraParser.parse(source);

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

    tokenize(source) {
        // For backward compatibility, provide tokenization
        // This is used by the debug/introspection features
        const tokenizer = new Tokenizer(source);
        const tokens = [];

        let token;
        do {
            token = tokenizer.nextToken();
            tokens.push({
                type: token.type,
                value: token.value,
                range: token.range,
                loc: {
                    start: token.start,
                    end: token.end
                }
            });
        } while (token.type !== 'EOF');

        return tokens;
    }
};

export default parser;
