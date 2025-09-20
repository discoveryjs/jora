/**
 * Production-ready Jora parser - Compact, performant, extensible
 * Based on recursive descent with precedence climbing for operators
 */
import { Tokenizer, TokenType } from './tokenizer.js';
import * as build from '../build.js';

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
    [TokenType.DOUBLE_DOT, 14],
    [TokenType.TRIPLE_DOT, 14]
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
        return build.Block([], expr);
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
                left = build.Conditional(left, consequent, alternate);
            } else if (op.type === TokenType.PIPE) {
                // Pipeline operator
                const right = this.parseExpression(prec + (rightAssoc ? 0 : 1));
                left = build.Pipeline(left, right);
            } else if (op.type === TokenType.IS) {
                // Assertion operator
                const assertion = this.parseAssertion();
                left = build.Postfix(left, assertion);
            } else {
                // Binary operators
                const right = this.parseExpression(prec + (rightAssoc ? 0 : 1));
                left = build.Binary(op.value, left, right);
            }
        }

        return left;
    }

    parseUnary() {
        // Unary prefix operators
        if (this.match(TokenType.NOT) || this.match(TokenType.PLUS) || this.match(TokenType.MINUS)) {
            const op = this.consume();
            const expr = this.parseUnary();
            return build.Prefix(op.value, expr);
        }

        // IS assertions as prefix
        if (this.match(TokenType.IS)) {
            const op = this.consume();
            const assertion = this.parseAssertion();
            return build.Prefix(op.value, assertion);
        }

        // Arrow functions without parameters
        if (this.match(TokenType.ARROW)) {
            this.consume();
            const body = this.parseExpression();
            return build.Function([], body);
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
                    expr = build.GetProperty(expr, build.Identifier(prop.value));
                } else if (this.match(TokenType.METHOD)) {
                    const method = this.parseMethodCall();
                    expr = build.MethodCall(expr, method);
                } else {
                    break;
                }
            } else if (this.match(TokenType.DOUBLE_DOT)) {
                this.advance();

                if (this.match(TokenType.IDENT)) {
                    const prop = this.consume();
                    expr = build.MapRecursive(expr, build.GetProperty(null, build.Identifier(prop.value)));
                } else {
                    break;
                }
            } else if (this.match(TokenType.LBRACKET)) {
                this.advance();

                if (this.match(TokenType.RBRACKET)) {
                    this.advance();
                    expr = build.Pick(expr, null);
                } else {
                    const index = this.parseExpression();
                    this.consume(TokenType.RBRACKET);
                    expr = build.Pick(expr, index);
                }
            } else {
                break;
            }
        }

        return expr;
    }

    parseAssertion() {
        let negation = false;
        
        // Handle 'not' negation
        if (this.match(TokenType.NOT)) {
            this.consume();
            negation = true;
        }
        
        if (this.match(TokenType.IDENT)) {
            const name = this.consume();
            return build.Assertion(build.Identifier(name.value), negation);
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
        return build.Method(build.Identifier(name.value), args);
    }

    parsePrimary() {
        // Literals
        if (this.match(TokenType.NUMBER) || this.match(TokenType.STRING) ||
            this.match(TokenType.REGEXP) || this.match(TokenType.LITERAL)) {
            const token = this.consume();
            return build.Literal(token.value);
        }

        // Template literals
        if (this.match(TokenType.TEMPLATE)) {
            const token = this.consume();
            return build.Template(token.value);
        }

        // Special references
        if (this.match(TokenType.DATA)) {
            this.consume();
            return build.Data();
        }

        if (this.match(TokenType.CONTEXT)) {
            this.consume();
            return build.Context();
        }

        if (this.match(TokenType.CURRENT)) {
            this.consume();
            return build.Current();
        }

        if (this.match(TokenType.ARG1)) {
            this.consume();
            return build.Arg1();
        }

        if (this.match(TokenType.VAR_REF)) {
            const token = this.consume();
            return build.Reference(token.value);
        }

        // Identifiers (property access)
        if (this.match(TokenType.IDENT)) {
            const token = this.consume();
            return build.GetProperty(null, build.Identifier(token.value));
        }

        // Method calls
        if (this.match(TokenType.METHOD)) {
            const method = this.parseMethodCall();
            return build.MethodCall(null, method);
        }

        // Dot notation (shorthand for @.property or map operations)
        if (this.match(TokenType.DOT)) {
            this.advance();
            if (this.match(TokenType.IDENT)) {
                const prop = this.consume();
                return build.GetProperty(null, build.Identifier(prop.value));
            } else if (this.match(TokenType.LPAREN)) {
                // Map operation .()
                this.advance(); // consume (
                const query = this.parseExpression();
                this.consume(TokenType.RPAREN);
                return build.Map(null, build.Block([], query));
            } else if (this.match(TokenType.LBRACKET)) {
                // Map with bracket notation .[expr]
                this.advance(); // consume [
                const query = this.parseExpression();
                this.consume(TokenType.RBRACKET);
                return build.Map(null, build.Block([], query));
            } else {
                throw new Error('Expected property name after dot');
            }
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
            return build.Parentheses(expr);
        }

        // Pipeline without left operand
        if (this.match(TokenType.PIPE)) {
            this.consume();
            const right = this.parseExpression();
            return build.Pipeline(null, right);
        }

        throw new Error(`Unexpected token ${this.current.type} at position ${this.current.pos}`);
    }

    parseArray() {
        this.consume(TokenType.LBRACKET);
        const elements = [];

        if (!this.match(TokenType.RBRACKET)) {
            elements.push(this.parseArrayElement());

            while (this.match(TokenType.COMMA)) {
                this.consume(); // consume comma
                if (!this.match(TokenType.RBRACKET)) { // allow trailing comma
                    elements.push(this.parseArrayElement());
                }
            }
        }

        this.consume(TokenType.RBRACKET);
        return build.Array(elements);
    }

    parseArrayElement() {
        // Handle spread syntax
        if (this.match(TokenType.TRIPLE_DOT)) {
            this.consume();
            const query = this.parseExpression();
            return build.Spread(query, true);
        }
        
        return this.parseExpression();
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
        return build.Object(entries);
    }

    parseObjectEntry() {
        let key;

        if (this.match(TokenType.IDENT)) {
            key = build.Identifier(this.consume().value);
        } else if (this.match(TokenType.STRING) || this.match(TokenType.NUMBER)) {
            const token = this.consume();
            key = build.Literal(token.value);
        } else {
            throw new Error('Expected object property name');
        }

        if (this.match(TokenType.COLON)) {
            this.consume();
            const value = this.parseExpression();
            return build.ObjectEntry(key, value);
        } else {
            // Shorthand property
            return build.ObjectEntry(key, null);
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
