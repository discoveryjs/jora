/**
 * Production-ready Jora parser - Compact, performant, extensible
 * Based on recursive descent with precedence climbing for operators
 */
import { Tokenizer } from './tokenizer.js';
import {
    TOKEN_NUMBER, TOKEN_STRING, TOKEN_REGEXP, TOKEN_LITERAL, TOKEN_IDENT, TOKEN_$IDENT,
    TOKEN_AT, TOKEN_HASH, TOKEN_$, TOKEN_$$,
    TOKEN_AND, TOKEN_OR, TOKEN_NOT, TOKEN_NO, TOKEN_IS, TOKEN_IN, TOKEN_NOTIN, TOKEN_HAS, TOKEN_HASNO, TOKEN_ORDER,
    TOKEN_METHOD_OPEN, TOKEN_$METHOD_OPEN,
    TOKEN_TEMPLATE, TOKEN_TPL_START, TOKEN_TPL_CONTINUE, TOKEN_TPL_END,
    TOKEN_DOT, TOKEN_DOT_DOT, TOKEN_DOT_DOT_DOT, TOKEN_DOT_OPEN_PAREN, TOKEN_DOT_OPEN_BRACKET, TOKEN_DOT_DOT_OPEN_PAREN,
    TOKEN_PIPE, TOKEN_ARROW, TOKEN_EQUALS, TOKEN_NOT_EQUALS, TOKEN_MATCH,
    TOKEN_LESS_THAN, TOKEN_LESS_THAN_EQUALS, TOKEN_GREATER_THAN, TOKEN_GREATER_THAN_EQUALS,
    TOKEN_PLUS, TOKEN_MINUS, TOKEN_MULTIPLY, TOKEN_DIVIDE, TOKEN_MODULO, TOKEN_NULLISH_COALESCING, TOKEN_QUESTION,
    TOKEN_OPEN_PAREN, TOKEN_CLOSE_PAREN, TOKEN_OPEN_BRACKET, TOKEN_CLOSE_BRACKET,
    TOKEN_OPEN_BRACE, TOKEN_CLOSE_BRACE, TOKEN_COMMA, TOKEN_COLON, TOKEN_SEMICOLON,
    TOKEN_EOF,
    tokenNames
} from './tokens.js';
import * as build from '../build.js';

// Spread type constants
const SPREAD_ARRAY = true;
const SPREAD_OBJECT = false;

// Operator precedence table (higher = higher precedence)
const PRECEDENCE = new Map([
    [TOKEN_ARROW, 1],
    [TOKEN_ORDER, 2],  // ORDER has lower precedence than PIPE
    [TOKEN_PIPE, 3],   // So pipeline binds tighter: foo | bar desc -> (foo | bar) desc
    [TOKEN_QUESTION, 4],
    [TOKEN_IS, 5],
    [TOKEN_OR, 6],
    [TOKEN_AND, 7],
    [TOKEN_NULLISH_COALESCING, 8],
    [TOKEN_NOT, 9],
    [TOKEN_NO, 9],
    [TOKEN_IN, 10],
    [TOKEN_NOTIN, 10],
    [TOKEN_HAS, 10],
    [TOKEN_HASNO, 10],
    [TOKEN_EQUALS, 11],
    [TOKEN_NOT_EQUALS, 11],
    [TOKEN_MATCH, 11],
    [TOKEN_LESS_THAN, 12],
    [TOKEN_LESS_THAN_EQUALS, 12],
    [TOKEN_GREATER_THAN, 12],
    [TOKEN_GREATER_THAN_EQUALS, 12],
    [TOKEN_PLUS, 13],
    [TOKEN_MINUS, 13],
    [TOKEN_MULTIPLY, 13],
    [TOKEN_DIVIDE, 13],
    [TOKEN_MODULO, 13],
    [TOKEN_DOT, 14],
    [TOKEN_DOT_DOT, 14],
    [TOKEN_DOT_DOT_DOT, 14],
    [TOKEN_DOT_OPEN_PAREN, 14],
    [TOKEN_DOT_OPEN_BRACKET, 14],
    [TOKEN_DOT_DOT_OPEN_PAREN, 14]
]);

const RIGHT_ASSOCIATIVE = new Set([TOKEN_ARROW, TOKEN_QUESTION]);

export class Parser {
    constructor(tokenizer) {
        this.tokenizer = tokenizer;
        this.current = null;
        this.advance(); // Initial advance without type check
    }

    maybe(fn) {
        const tokenizerPos = this.tokenizer.pos;
        const bracketStack = [...this.tokenizer.bracketStack];
        const current = this.current;

        try {
            return fn.call(this);
        } catch (error) {
            this.tokenizer.pos = tokenizerPos;
            this.tokenizer.bracketStack = bracketStack;
            this.current = current;
            return null;
        }
    }

    // Helper to throw parsing errors with position tracking
    throwError(message) {
        throw new Error(message); // TODO: Add position tracking later
    }

    match(type) {
        return this.current.type === type;
    }

    advance(expectedType) {
        if (expectedType !== undefined && this.current.type !== expectedType) {
            this.throwError(`Expected \`${tokenNames[expectedType]}\`, got \`${tokenNames[this.current.type]}\``);
        }

        const token = this.current;
        this.current = this.tokenizer.nextToken();
        return token;
    }

    advanceIf(type) {
        return this.current.type === type
            ? this.advance()
            : null;
    }

    consumeValue(expectedType) {
        const value = this.current.value;
        this.advance(expectedType);
        return value;
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
        try {
            return this.parseBlock();
        } finally {
            // Ensure nothing left after parsing
            this.advance(TOKEN_EOF);
        }
    }

    parseBlock() {
        return build.Block(
            this.parseDefinitions(),
            this.parseExpression() || build.Placeholder()
        );
    }

    parseDefinitions() {
        const definitions = [];
        let definition;

        while (definition = this.maybe(this.parseDefinition)) {
            definitions.push(definition);
        }

        return definitions;
    }

    parseDefinition() {
        const declarator = this.parseDeclarator();
        const value = this.advanceIf(TOKEN_COLON)
            ? this.parseExpression()
            : null;

        this.advance(TOKEN_SEMICOLON); // consume ';'

        return build.Definition(declarator, value);
    }

    parseDeclarator() {
        const name = this.match(TOKEN_$IDENT)
            ? this.consumeValue().slice(1)
            : this.advanceIf(TOKEN_$)
                ? null
                : this.throwError('Expected declarator');

        return build.Declarator(name);
    }

    parseIdentifier(refAsIdentifier = false) {
        if (refAsIdentifier) {
            return build.Identifier(this.consumeValue(TOKEN_$IDENT).slice(1));
        }

        return build.Identifier(this.consumeValue(TOKEN_IDENT));
    }

    // Multi-build helper methods
    parseIdentifierOrReference() {
        switch (this.current.type) {
            case TOKEN_IDENT:
                return build.Identifier(this.consumeValue());

            case TOKEN_LITERAL:
                return build.Identifier(String(this.consumeValue()));

            case TOKEN_METHOD_OPEN:
                // Remove ( suffix only
                return build.Identifier(this.consumeValue().slice(0, -1));

            case TOKEN_$IDENT:
                // Remove $ prefix
                return build.Reference(build.Identifier(this.consumeValue().slice(1)));

            case TOKEN_$METHOD_OPEN:
                // Remove $ prefix and ( suffix
                return build.Reference(build.Identifier(this.consumeValue().slice(1, -1)));

            default:
                this.throwError('Expected identifier or reference');
        }
    }

    parseSpecialReference() {
        switch (this.current.type) {
            case TOKEN_AT:
                this.advance();
                return build.Data();

            case TOKEN_HASH:
                this.advance();
                return build.Context();

            case TOKEN_$:
                this.advance();
                return build.Current();

            case TOKEN_$$:
                this.advance();
                return build.Arg1();

            default:
                this.throwError('Expected special reference');
        }
    }

    parseLiteralValue() {
        switch (this.current.type) {
            case TOKEN_NUMBER:
            case TOKEN_LITERAL:
            case TOKEN_STRING:
            case TOKEN_REGEXP:
                // Tokenizer already converted these values
                return build.Literal(this.consumeValue());

            case TOKEN_TEMPLATE:
            case TOKEN_TPL_START:
            case TOKEN_TPL_CONTINUE:
            case TOKEN_TPL_END:
                return build.Literal(this.consumeValue());

            default:
                this.throwError('Expected literal value');
        }
    }

    parseExpression(minPrec = 0) {
        let left = this.parseUnary();

        while (this.isOperator(this.current.type) &&
               this.getPrecedence(this.current.type) >= minPrec &&
               !this.match(TOKEN_EOF)) {
            const op = this.current;
            const prec = this.getPrecedence(op.type);
            const rightAssoc = this.isRightAssociative(op.type);

            switch (op.type) {
                case TOKEN_QUESTION: {
                    // Ternary operator
                    left = this.parseTernaryConditional(left, prec, rightAssoc);
                    break;
                }
                case TOKEN_PIPE: {
                    // Pipeline operator
                    left = this.parsePipeline(left);
                    break;
                }
                case TOKEN_IS: {
                    // Assertion operator
                    left = this.parseAssertionPostfix(left);
                    break;
                }
                case TOKEN_ORDER: {
                    // Compare function
                    left = this.parseCompareFunction(left);
                    break;
                }
                default: {
                    // Binary operators
                    left = this.parseBinaryOperator(left, prec, rightAssoc);
                }
            }
        }

        return left;
    }

    parseUnary() {
        switch (this.current.type) {
            case TOKEN_NOT:
            case TOKEN_NO:
            case TOKEN_PLUS:
            case TOKEN_MINUS:
            case TOKEN_IS:
                return this.parseUnaryPrefix();

            case TOKEN_ARROW:
                return this.parseFunction();

            default:
                return this.parsePostfix();
        }
    }

    parsePostfix() {
        let expr = this.parsePrimary();

        while (!this.match(TOKEN_EOF)) {
            switch (this.current.type) {
                case TOKEN_DOT:
                    this.advanceIf(TOKEN_DOT); // consume '.'

                    switch (this.current.type) {
                        case TOKEN_IDENT:
                            expr = this.parseGetProperty(expr);
                            break;
                        case TOKEN_METHOD_OPEN:
                        case TOKEN_$METHOD_OPEN:
                            expr = this.parseMethodCall(expr);
                            break;
                        default:
                            this.throwError('Expected property name or method call after dot');
                    }
                    break;

                case TOKEN_DOT_OPEN_PAREN:
                    expr = this.parseMap(expr);
                    break;

                case TOKEN_DOT_OPEN_BRACKET:
                    expr = this.parseFilter(expr);
                    break;

                case TOKEN_DOT_DOT_OPEN_PAREN:
                    expr = this.parseMapRecursive(expr);
                    break;

                case TOKEN_DOT_DOT:
                    this.advanceIf(TOKEN_DOT_DOT); // consume '..'

                    switch (this.current.type) {
                        case TOKEN_IDENT:
                            expr = this.parseMapRecursive(expr, this.parseGetProperty(null));
                            break;
                        case TOKEN_METHOD_OPEN:
                        case TOKEN_$METHOD_OPEN:
                            expr = this.parseMapRecursive(expr, this.parseMethodCall(null));
                            break;
                        default:
                            this.throwError('Expected property name or method call after ..');
                    }
                    break;

                case TOKEN_OPEN_BRACKET: {
                    expr = this.maybe(this.parseSliceNotation) || this.parseBracketAccess(expr);
                    break;
                }

                default:
                    return expr; // End of postfix chain
            }
        }

        return expr;
    }

    parseAssertion() {
        const negate = Boolean(this.advanceIf(TOKEN_NOT));

        // Handle parentheses
        if (this.advanceIf(TOKEN_OPEN_PAREN)) {
            const terms = [];

            while (!this.advanceIf(TOKEN_CLOSE_PAREN)) {
                terms.push(this.parseAssertion());
                if (this.match(TOKEN_AND) || this.match(TOKEN_OR)) {
                    terms.push(this.consumeValue());
                }
            }

            return build.Assertion(terms, negate);
        }

        // Handle assertion terms
        switch (this.current.type) {
            case TOKEN_IDENT:
            case TOKEN_$IDENT:
            case TOKEN_LITERAL:
                return build.Assertion(this.parseIdentifierOrReference(), negate);

            default:
                this.throwError('Expected assertion term');
        }
    }

    parseGetProperty(expr = null) {
        return build.GetProperty(expr, this.parseIdentifier());
    }

    parseMethod() {
        if (!this.match(TOKEN_METHOD_OPEN) && !this.match(TOKEN_$METHOD_OPEN)) {
            this.throwError('Expected token type for method call');
        }

        // Extract method name based on token type
        const methodRef = this.parseIdentifierOrReference();

        const args = [];
        if (!this.match(TOKEN_CLOSE_PAREN)) {
            do {
                args.push(this.parseExpression());
            } while (this.advanceIf(TOKEN_COMMA));
        }

        this.advance(TOKEN_CLOSE_PAREN);

        return build.Method(methodRef, args);
    }

    parseMethodCall(value = null) {
        return build.MethodCall(value, this.parseMethod());
    }

    parseTemplate() {
        if (this.match(TOKEN_TEMPLATE)) {
            return build.Template([this.parseLiteralValue()]);
        }

        const parts = [
            // Start with TPL_START token
            this.parseLiteralValue()
        ];

        // Parse template expressions and continuations
        while (true) {
            // Parse the expression inside ${}
            parts.push(this.parseExpression());

            if (this.match(TOKEN_TPL_CONTINUE)) {
                parts.push(this.parseLiteralValue());
            } else {
                break;
            }
        }

        // End with TPL_END token
        parts.push(this.parseLiteralValue());

        return build.Template(parts);
    }

    parsePrimary() {
        switch (this.current.type) {
            case TOKEN_NUMBER:
            case TOKEN_STRING:
            case TOKEN_REGEXP:
            case TOKEN_LITERAL:
                return this.parseLiteralValue();

            case TOKEN_TEMPLATE:
            case TOKEN_TPL_START:
                return this.parseTemplate();

            case TOKEN_AT:
            case TOKEN_HASH:
            case TOKEN_$:
            case TOKEN_$$:
                return this.parseSpecialReference();

            case TOKEN_$IDENT:
                return this.maybe(this.parseFunction) || this.parseIdentifierOrReference();

            case TOKEN_IDENT:
                return this.parseGetProperty();

            case TOKEN_METHOD_OPEN:
            case TOKEN_$METHOD_OPEN:
                return this.parseMethodCall(null);

            case TOKEN_DOT:
                this.advance(TOKEN_DOT); // consume '.'

                switch (this.current.type) {
                    case TOKEN_IDENT:
                        return this.parseGetProperty(null);
                    case TOKEN_METHOD_OPEN:
                    case TOKEN_$METHOD_OPEN:
                        return this.parseMethodCall(null);
                    default:
                        this.throwError('Expected property name or method call after dot');
                }

            case TOKEN_DOT_OPEN_PAREN:
                return this.parseMap(null);

            case TOKEN_DOT_OPEN_BRACKET:
                return this.parseFilter(null);

            case TOKEN_DOT_DOT: {
                this.advanceIf(TOKEN_DOT_DOT); // consume '..'

                switch (this.current.type) {
                    case TOKEN_IDENT:
                        return this.parseMapRecursive(null, this.parseGetProperty(null));
                    case TOKEN_METHOD_OPEN:
                    case TOKEN_$METHOD_OPEN:
                        return this.parseMapRecursive(null, this.parseMethodCall(null));
                    default:
                        this.throwError('Expected property name after ..');
                }
            }

            case TOKEN_OPEN_BRACKET:
                return this.maybe(this.parseSliceNotation) || this.parseArray();

            case TOKEN_OPEN_BRACE:
                return this.parseObject();

            case TOKEN_OPEN_PAREN:
                return this.maybe(this.parseFunction) || this.parseParentheses();

            case TOKEN_PIPE:
                return this.parsePipeline(null);

            default:
                return null;
        }
    }

    parseFunction() {
        const params = [];

        if (this.advanceIf(TOKEN_OPEN_PAREN)) {
            // Parse parameter list
            if (!this.match(TOKEN_CLOSE_PAREN)) {
                do {
                    params.push(this.parseIdentifier(true));
                } while (this.advanceIf(TOKEN_COMMA));
            }

            this.advance(TOKEN_CLOSE_PAREN);
        } else if (this.match(TOKEN_$IDENT)) {
            params.push(this.parseIdentifier(true));
        }

        this.advance(TOKEN_ARROW);

        return build.Function(params, this.parseExpression() || build.Placeholder());
    }

    parseCompareFunction(expr) {
        const compares = [this.parseCompare(expr)];

        while (this.advanceIf(TOKEN_COMMA)) {
            // Parse the next expression with precedence higher than ORDER to avoid nested CompareFunction
            const compareExpr = this.parseExpression(this.getPrecedence(TOKEN_ORDER) + 1);
            compares.push(this.parseCompare(compareExpr));
        }

        return build.CompareFunction(compares);
    }

    parseCompare(expr) {
        return build.Compare(expr, this.consumeValue(TOKEN_ORDER));
    }

    parseParentheses() {
        this.advance(TOKEN_OPEN_PAREN);
        
        // Try to parse definitions first (like legacy parser)
        const definitions = this.parseDefinitions();
        const expression = this.parseExpression() || build.Placeholder();
        
        this.advance(TOKEN_CLOSE_PAREN);
        
        // If we have definitions, wrap in a Block, otherwise just return the expression
        const body = definitions.length > 0 
            ? build.Block(definitions, expression)
            : expression;
            
        return build.Parentheses(body);
    }

    parseArray() {
        this.advance(TOKEN_OPEN_BRACKET);

        // Check if empty bracket (empty array)
        if (this.advanceIf(TOKEN_CLOSE_BRACKET)) {
            return build.Array([]);
        }

        // Otherwise parse as array literal
        const elements = [];
        do {
            // Check for invalid cases like immediate comma
            if (this.match(TOKEN_COMMA)) {
                this.throwError('Expected expression before comma in array literal');
            }

            elements.push(this.parseArrayElement());
        } while (this.advanceIf(TOKEN_COMMA) && !this.match(TOKEN_CLOSE_BRACKET));

        this.advance(TOKEN_CLOSE_BRACKET);
        return build.Array(elements);
    }

    parseArrayElement() {
        // Handle spread syntax
        if (this.match(TOKEN_DOT_DOT_DOT)) {
            return this.parseSpread(SPREAD_ARRAY);
        }

        return this.parseExpression();
    }

    parseSliceNotation() {
        this.advance(TOKEN_OPEN_BRACKET);

        const args = [this.parseExpression()];

        // Parse first argument (might be empty for [:end] notation)
        this.advance(TOKEN_COLON);
        args.push(this.parseExpression());

        if (this.advanceIf(TOKEN_COLON)) {
            args.push(this.parseExpression());
        }

        this.advance(TOKEN_CLOSE_BRACKET);

        return build.SliceNotation(null, args);
    }

    parseObject() {
        this.advance(TOKEN_OPEN_BRACE);

        // First, try to parse any definitions (like parseBlock does)
        const definitions = this.parseDefinitions();
        const entries = [];

        if (!this.match(TOKEN_CLOSE_BRACE)) {
            entries.push(this.parseObjectEntry());

            while (this.advanceIf(TOKEN_COMMA)) {
                if (!this.match(TOKEN_CLOSE_BRACE)) { // allow trailing comma
                    entries.push(this.parseObjectEntry());
                }
            }
        }

        this.advance(TOKEN_CLOSE_BRACE);

        // If we found definitions, wrap the object in a Block (like legacy parser does)
        if (definitions.length > 0) {
            return build.Block(definitions, build.Object(entries));
        }

        return build.Object(entries);
    }

    parseObjectEntry() {
        // Handle spread syntax: ...expression
        if (this.match(TOKEN_DOT_DOT_DOT)) {
            return this.parseSpread(SPREAD_OBJECT);
        }

        let key;

        // Parse object key using existing methods
        switch (this.current.type) {
            case TOKEN_IDENT:
                key = this.parseIdentifierOrReference();
                break;

            case TOKEN_LITERAL:
                // Literal values (true, false, null, etc.) should be treated as literals in object keys
                key = this.parseLiteralValue();
                break;

            case TOKEN_$IDENT: {
                // $variables in object context depend on whether it's shorthand or explicit
                const tokenValue = this.consumeValue();
                
                if (this.match(TOKEN_COLON)) {
                    // Explicit property: treat as identifier with $ preserved
                    key = build.Identifier(tokenValue);
                } else {
                    // Shorthand property: treat as reference
                    key = build.Reference(build.Identifier(tokenValue.slice(1)));
                }
                break;
            }

            case TOKEN_$:
                key = this.parseSpecialReference();
                break;

            case TOKEN_STRING:
            case TOKEN_NUMBER:
            case TOKEN_REGEXP:
                key = this.parseLiteralValue();
                break;

            case TOKEN_OPEN_BRACKET:
                // Computed property name: [expression]
                this.advance();
                key = this.parseExpression();
                this.advance(TOKEN_CLOSE_BRACKET); // consume ]
                break;

            default:
                this.throwError('Expected object property name');
        }

        if (this.advanceIf(TOKEN_COLON)) {
            return build.ObjectEntry(key, this.parseExpression());
        }

        // Shorthand property
        return build.ObjectEntry(key, null);
    }

    // Dedicated parse methods for single AST node creation
    parseMap(value) {
        this.advance(TOKEN_DOT_OPEN_PAREN);
        const query = this.parseBlock();
        this.advance(TOKEN_CLOSE_PAREN);
        return build.Map(value, query);
    }

    parseFilter(value) {
        this.advance(TOKEN_DOT_OPEN_BRACKET);
        const query = this.parseBlock();
        this.advance(TOKEN_CLOSE_BRACKET);
        return build.Filter(value, query);
    }

    parseMapRecursive(value, property = null) {
        if (property) {
            return build.MapRecursive(value, property);
        }

        this.advance(TOKEN_DOT_DOT_OPEN_PAREN);
        const query = this.parseBlock();
        this.advance(TOKEN_CLOSE_PAREN);
        return build.MapRecursive(value, query);
    }

    parsePick(value, index = null) {
        if (index !== undefined) {
            return build.Pick(value, index);
        }

        this.advance(TOKEN_OPEN_BRACKET);
        if (this.advanceIf(TOKEN_CLOSE_BRACKET)) {
            return build.Pick(value, null);
        }

        const getter = this.parseExpression();
        this.advance(TOKEN_CLOSE_BRACKET);
        return build.Pick(value, getter);
    }

    parseSpread(isArray) {
        this.advance(TOKEN_DOT_DOT_DOT);
        return build.Spread(this.parseExpression(), isArray);
    }

    parsePipeline(left) {
        this.advance(TOKEN_PIPE);

        // Parse right side: definitions + expression with proper precedence
        const definitions = this.parseDefinitions();
        const body = this.parseExpression(this.getPrecedence(TOKEN_PIPE) + 1) || build.Placeholder();

        // If we have definitions, wrap in a Block like parseBlock does
        const right = definitions.length > 0
            ? build.Block(definitions, body)
            : body;

        return build.Pipeline(left, right);
    }

    parseTernaryConditional(condition, prec, rightAssoc) {
        this.advance(TOKEN_QUESTION);
        const consequent = this.parseExpression(prec + (rightAssoc ? 0 : 1)) || build.Placeholder();
        const alternate = this.advanceIf(TOKEN_COLON)
            ? this.parseExpression(prec + (rightAssoc ? 0 : 1))
            : null;

        return build.Conditional(condition, consequent, alternate);
    }

    parseAssertionPostfix(left) {
        this.advance(TOKEN_IS);
        return build.Postfix(left, this.parseAssertion());
    }

    parseBinaryOperator(left, prec, rightAssoc) {
        const operator = this.consumeValue();
        const right = this.parseExpression(prec + (rightAssoc ? 0 : 1));

        if (!right) {
            this.throwError('Expected expression after operator');
        }

        return build.Binary(operator, left, right);
    }

    parseUnaryPrefix() {
        const operator = this.consumeValue();
        return build.Prefix(
            operator,
            operator === 'is'
                ? this.parseAssertion()
                : this.parseUnary()
        );
    }

    parseBracketAccess(expr) {
        this.advance(TOKEN_OPEN_BRACKET);
        const getter = this.parseExpression();
        this.advance(TOKEN_CLOSE_BRACKET);
        return build.Pick(expr, getter);
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
