/**
 * Production-ready Jora parser - Compact, performant, extensible
 * Based on recursive descent with precedence climbing for operators
 */
import { Tokenizer, TokenType } from './tokenizer.js';

// Operator precedence table (higher = higher precedence)
const PRECEDENCE = new Map([
    [TokenType.ARROW, 1],
    [TokenType.PIPE, 2],
    [TokenType.QUESTION, 3],
    [TokenType.IS, 4],
    [TokenType.OR, 5],
    [TokenType.AND, 6],
    [TokenType.NULLISH, 7],
    [TokenType.NOT, 8],
    [TokenType.IN, 9],
    [TokenType.HAS, 9],
    [TokenType.EQ, 10],
    [TokenType.NE, 10],
    [TokenType.MATCH, 10],
    [TokenType.LT, 11],
    [TokenType.LE, 11],
    [TokenType.GT, 11],
    [TokenType.GE, 11],
    [TokenType.PLUS, 12],
    [TokenType.MINUS, 12],
    [TokenType.MULT, 13],
    [TokenType.DIV, 13],
    [TokenType.MOD, 13],
    [TokenType.DOT, 14],
    [TokenType.DOUBLE_DOT, 14]
]);

const RIGHT_ASSOCIATIVE = new Set([TokenType.ARROW, TokenType.QUESTION]);

export class Parser {
    constructor(tokenizer) {
        this.tokenizer = tokenizer;
        this.current = null;
        this.advance();
    }

    advance() {
        this.current = this.tokenizer.nextToken();
        return this.current;
    }

    match(type) {
        return this.current.type === type;
    }

    consume(expectedType) {
        if (expectedType && this.current.type !== expectedType) {
            throw new Error(`Expected ${expectedType}, got ${this.current.type} at position ${this.current.pos}`);
        }
        const token = this.current;
        this.advance();
        return token;
    }

    getPrecedence(type) {
        return PRECEDENCE.get(type) || 0;
    }

    isOperator(type) {
        return PRECEDENCE.has(type);
    }

    isRightAssociative(type) {
        return RIGHT_ASSOCIATIVE.has(type);
    }

    parse() {
        const expr = this.parseExpression();
        this.consume(TokenType.EOF);
        return {
            type: 'Block',
            definitions: [],
            body: expr
        };
    }

    parseExpression(minPrec = 0) {
        let left = this.parseUnary();

        while (this.isOperator(this.current.type) &&
               this.getPrecedence(this.current.type) >= minPrec &&
               !this.match(TokenType.EOF)) {
            const op = this.current;
            const prec = this.getPrecedence(op.type);
            const rightAssoc = this.isRightAssociative(op.type);
            this.advance();

            if (op.type === TokenType.QUESTION) {
                // Ternary operator
                const consequent = this.parseExpression();
                this.consume(TokenType.COLON);
                const alternate = this.parseExpression(prec + (rightAssoc ? 0 : 1));
                left = {
                    type: 'Conditional',
                    test: left,
                    consequent,
                    alternate
                };
            } else if (op.type === TokenType.PIPE) {
                // Pipeline operator
                const right = this.parseExpression(prec + (rightAssoc ? 0 : 1));
                left = {
                    type: 'Pipeline',
                    left,
                    right
                };
            } else if (op.type === TokenType.IS) {
                // Assertion operator
                const assertion = this.parseAssertion();
                left = {
                    type: 'Postfix',
                    left,
                    assertion
                };
            } else {
                // Binary operators
                const right = this.parseExpression(prec + (rightAssoc ? 0 : 1));
                left = {
                    type: 'Binary',
                    operator: op.value,
                    left,
                    right
                };
            }
        }

        return left;
    }

    parseUnary() {
        // Unary prefix operators
        if (this.match(TokenType.NOT) || this.match(TokenType.PLUS) || this.match(TokenType.MINUS)) {
            const op = this.consume();
            const expr = this.parseUnary();
            return {
                type: 'Prefix',
                operator: op.value,
                expression: expr
            };
        }

        // Arrow functions without parameters
        if (this.match(TokenType.ARROW)) {
            this.consume();
            const body = this.parseExpression();
            return {
                type: 'Function',
                params: [],
                body
            };
        }

        return this.parsePostfix();
    }

    parsePostfix() {
        let expr = this.parsePrimary();

        while (!this.match(TokenType.EOF)) {
            if (this.match(TokenType.DOT)) {
                this.advance();

                if (this.match(TokenType.IDENT)) {
                    const prop = this.consume();
                    expr = {
                        type: 'GetProperty',
                        value: expr,
                        property: {
                            type: 'Identifier',
                            name: prop.value
                        }
                    };
                } else if (this.match(TokenType.METHOD)) {
                    const method = this.parseMethodCall();
                    expr = {
                        type: 'MethodCall',
                        value: expr,
                        method
                    };
                } else {
                    break;
                }
            } else if (this.match(TokenType.DOUBLE_DOT)) {
                this.advance();

                if (this.match(TokenType.IDENT)) {
                    const prop = this.consume();
                    expr = {
                        type: 'MapRecursive',
                        query: expr,
                        expression: {
                            type: 'GetProperty',
                            value: null,
                            property: {
                                type: 'Identifier',
                                name: prop.value
                            }
                        }
                    };
                } else {
                    break;
                }
            } else if (this.match(TokenType.LBRACKET)) {
                this.advance();

                if (this.match(TokenType.RBRACKET)) {
                    this.advance();
                    expr = {
                        type: 'Pick',
                        value: expr,
                        getter: null
                    };
                } else {
                    const index = this.parseExpression();
                    this.consume(TokenType.RBRACKET);
                    expr = {
                        type: 'Pick',
                        value: expr,
                        getter: index
                    };
                }
            } else {
                break;
            }
        }

        return expr;
    }

    parseAssertion() {
        if (this.match(TokenType.IDENT)) {
            const name = this.consume();
            return {
                type: 'Assertion',
                assertion: {
                    type: 'Identifier',
                    name: name.value
                }
            };
        }
        throw new Error('Expected assertion term');
    }

    parseMethodCall() {
        const name = this.consume(TokenType.METHOD);
        this.consume(TokenType.LPAREN);

        const args = [];
        if (!this.match(TokenType.RPAREN)) {
            do {
                args.push(this.parseExpression());
            } while (this.match(TokenType.COMMA) && this.consume());
        }

        this.consume(TokenType.RPAREN);
        return {
            type: 'Method',
            name: {
                type: 'Identifier',
                name: name.value
            },
            arguments: args
        };
    }

    parsePrimary() {
        // Literals
        if (this.match(TokenType.NUMBER) || this.match(TokenType.STRING) ||
            this.match(TokenType.REGEXP) || this.match(TokenType.LITERAL)) {
            const token = this.consume();
            return {
                type: 'Literal',
                value: token.value
            };
        }

        // Special references
        if (this.match(TokenType.DATA)) {
            this.consume();
            return { type: 'Data' };
        }

        if (this.match(TokenType.CONTEXT)) {
            this.consume();
            return { type: 'Context' };
        }

        if (this.match(TokenType.CURRENT)) {
            this.consume();
            return { type: 'Current' };
        }

        if (this.match(TokenType.ARG1)) {
            this.consume();
            return { type: 'Arg1' };
        }

        if (this.match(TokenType.VAR_REF)) {
            const token = this.consume();
            return {
                type: 'Reference',
                name: token.value
            };
        }

        // Identifiers (property access)
        if (this.match(TokenType.IDENT)) {
            const token = this.consume();
            return {
                type: 'GetProperty',
                value: null,
                property: {
                    type: 'Identifier',
                    name: token.value
                }
            };
        }

        // Method calls
        if (this.match(TokenType.METHOD)) {
            const method = this.parseMethodCall();
            return {
                type: 'MethodCall',
                value: null,
                method
            };
        }

        // Arrays
        if (this.match(TokenType.LBRACKET)) {
            return this.parseArray();
        }

        // Objects
        if (this.match(TokenType.LBRACE)) {
            return this.parseObject();
        }

        // Parenthesized expressions
        if (this.match(TokenType.LPAREN)) {
            this.consume();
            const expr = this.parseExpression();
            this.consume(TokenType.RPAREN);
            return {
                type: 'Parentheses',
                body: expr
            };
        }

        // Pipeline without left operand
        if (this.match(TokenType.PIPE)) {
            this.consume();
            const right = this.parseExpression();
            return {
                type: 'Pipeline',
                left: null,
                right
            };
        }

        throw new Error(`Unexpected token ${this.current.type} at position ${this.current.pos}`);
    }

    parseArray() {
        this.consume(TokenType.LBRACKET);
        const elements = [];

        if (!this.match(TokenType.RBRACKET)) {
            elements.push(this.parseExpression());

            while (this.match(TokenType.COMMA)) {
                this.consume(); // consume comma
                if (!this.match(TokenType.RBRACKET)) { // allow trailing comma
                    elements.push(this.parseExpression());
                }
            }
        }

        this.consume(TokenType.RBRACKET);
        return {
            type: 'Array',
            elements
        };
    }

    parseObject() {
        this.consume(TokenType.LBRACE);
        const entries = [];

        if (!this.match(TokenType.RBRACE)) {
            entries.push(this.parseObjectEntry());

            while (this.match(TokenType.COMMA)) {
                this.consume(); // consume comma
                if (!this.match(TokenType.RBRACE)) { // allow trailing comma
                    entries.push(this.parseObjectEntry());
                }
            }
        }

        this.consume(TokenType.RBRACE);
        return {
            type: 'Object',
            properties: entries
        };
    }

    parseObjectEntry() {
        let key;

        if (this.match(TokenType.IDENT)) {
            key = {
                type: 'Identifier',
                name: this.consume().value
            };
        } else if (this.match(TokenType.STRING) || this.match(TokenType.NUMBER)) {
            const token = this.consume();
            key = {
                type: 'Literal',
                value: token.value
            };
        } else {
            throw new Error('Expected object property name');
        }

        if (this.match(TokenType.COLON)) {
            this.consume();
            const value = this.parseExpression();
            return {
                type: 'ObjectEntry',
                key,
                value
            };
        } else {
            // Shorthand property
            return {
                type: 'ObjectEntry',
                key,
                value: null
            };
        }
    }
}

// Main parser class
export class JoraParser {
    constructor(options = {}) {
        this.options = options;
    }

    parse(input) {
        const tokenizer = new Tokenizer(input);
        const parser = new Parser(tokenizer);
        return parser.parse();
    }
}

// Export for compatibility
export default function createParser(options) {
    const parser = new JoraParser(options);
    return (input) => parser.parse(input);
}
