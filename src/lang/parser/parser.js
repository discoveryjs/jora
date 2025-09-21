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

// Operator precedence table (higher = higher precedence)
const PRECEDENCE = new Map([
    [TOKEN_ARROW, 1],
    [TOKEN_PIPE, 2],
    [TOKEN_QUESTION, 3],
    [TOKEN_IS, 4],
    [TOKEN_OR, 5],
    [TOKEN_AND, 6],
    [TOKEN_NULLISH_COALESCING, 7],
    [TOKEN_NOT, 8],
    [TOKEN_NO, 8],
    [TOKEN_IN, 9],
    [TOKEN_NOTIN, 9],
    [TOKEN_HAS, 9],
    [TOKEN_HASNO, 9],
    [TOKEN_EQUALS, 10],
    [TOKEN_NOT_EQUALS, 10],
    [TOKEN_MATCH, 10],
    [TOKEN_LESS_THAN, 11],
    [TOKEN_LESS_THAN_EQUALS, 11],
    [TOKEN_GREATER_THAN, 11],
    [TOKEN_GREATER_THAN_EQUALS, 11],
    [TOKEN_PLUS, 12],
    [TOKEN_MINUS, 12],
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
        this.advance();
    }

    advance() {
        this.current = this.tokenizer.nextToken();
        return this.current;
    }

    saveState() {
        return {
            tokenizerPos: this.tokenizer.pos,
            bracketStack: [...this.tokenizer.bracketStack],
            current: { ...this.current }
        };
    }

    restoreState(state) {
        this.tokenizer.pos = state.tokenizerPos;
        this.tokenizer.bracketStack = state.bracketStack;
        this.current = state.current;
    }

    match(type) {
        return this.current.type === type;
    }

    matchAdvance(type) {
        return this.current.type === type
            ? this.advance()
            : null;
    }

    consume(expectedType) {
        if (expectedType === undefined || this.current.type === expectedType) {
            const token = this.current;
            this.advance();
            return token;
        }

        this.throwError(`Expected \`${tokenNames[expectedType]}\`, got \`${tokenNames[this.current.type]}\``); //  at position ${this.current.offset}
    }

    consumeValue(expectedType) {
        return this.consume(expectedType).value;
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

    // Helper to create property access nodes
    property(name, obj = null) {
        return build.GetProperty(obj, build.Identifier(name));
    }

    // Helper to throw parsing errors with position tracking
    throwError(message) {
        throw new Error(message); // TODO: Add position tracking later
    }

    maybe(fn) {
        const savedState = this.saveState();
        try {
            return fn.call(this);
        } catch (error) {
            this.restoreState(savedState);
            return null;
        }
    }

    parse() {
        try {
            return this.parseBlock();
        } finally {
            // Ensure nothing left after parsing
            this.consume(TOKEN_EOF);
        }
    }

    parseBlock() {
        return build.Block(this.parseDefinitions(), this.parseExpression());
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
        const value = this.matchAdvance(TOKEN_COLON)
            ? this.parseExpression()
            : null;

        this.consume(TOKEN_SEMICOLON); // consume ';'

        return build.Definition(declarator, value);
    }

    parseDeclarator() {
        const name = this.match(TOKEN_$IDENT)
            ? this.consumeValue().slice(1)
            : this.matchAdvance(TOKEN_$)
                ? null
                : this.throwError('Expected declarator');

        return build.Declarator(name);
    }

    parseExpression(minPrec = 0) {
        let left = this.parseUnary();

        while (this.isOperator(this.current.type) &&
               this.getPrecedence(this.current.type) >= minPrec &&
               !this.match(TOKEN_EOF)) {
            const op = this.current;
            const prec = this.getPrecedence(op.type);
            const rightAssoc = this.isRightAssociative(op.type);
            this.advance();

            switch (op.type) {
                case TOKEN_QUESTION: {
                    // Ternary operator
                    left = this.parseTernaryConditional(left, prec, rightAssoc);
                    break;
                }
                case TOKEN_PIPE: {
                    // Pipeline operator
                    left = this.parsePipeline(left, prec + (rightAssoc ? 0 : 1));
                    break;
                }
                case TOKEN_IS: {
                    // Assertion operator
                    left = this.parseAssertionPostfix(left);
                    break;
                }
                default: {
                    // Binary operators
                    left = this.parseBinaryOperator(op.value, left, prec, rightAssoc);
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
                this.advance();
                return this.parseNoParameterArrowFunction();

            default:
                return this.parsePostfix();
        }
    }

    parsePostfix() {
        let expr = this.parsePrimary();

        while (!this.match(TOKEN_EOF)) {
            switch (this.current.type) {
                case TOKEN_DOT:
                    this.advance();
                    switch (this.current.type) {
                        case TOKEN_IDENT:
                            expr = this.property(this.consumeValue(), expr);
                            break;
                        case TOKEN_METHOD_OPEN:
                            expr = build.MethodCall(expr, this.parseMethodCall(TOKEN_METHOD_OPEN));
                            break;
                        default:
                            return expr; // End of postfix chain
                    }
                    break;

                case TOKEN_DOT_OPEN_PAREN:
                    expr = this.parseMap(expr);
                    break;

                case TOKEN_DOT_OPEN_BRACKET:
                    expr = this.parseFilter(expr);
                    break;

                case TOKEN_DOT_DOT:
                    this.advance();
                    switch (this.current.type) {
                        case TOKEN_IDENT:
                            expr = this.parseMapRecursive(expr, this.property(this.consumeValue()));
                            break;
                        case TOKEN_METHOD_OPEN:
                            expr = this.parseMapRecursive(expr, build.MethodCall(null, this.parseMethodCall(TOKEN_METHOD_OPEN)));
                            break;
                        default:
                            return expr; // End of postfix chain
                    }
                    break;

                case TOKEN_DOT_DOT_OPEN_PAREN:
                    expr = this.parseMapRecursive(expr);
                    break;

                case TOKEN_OPEN_BRACKET:
                    this.advance();
                    if (this.matchAdvance(TOKEN_CLOSE_BRACKET)) {
                        expr = build.Pick(expr, null);
                    } else {
                        // Check if this is slice notation by looking for colons
                        const args = [];
                        let isSliceNotation = false;

                        // Parse first argument (might be empty for [:end] notation)
                        if (this.match(TOKEN_COLON)) {
                            args.push(null);
                            isSliceNotation = true;
                        } else {
                            args.push(this.parseExpression());
                        }

                        // Check for colons to determine if this is slice notation
                        while (this.matchAdvance(TOKEN_COLON)) {
                            isSliceNotation = true;

                            if (this.match(TOKEN_CLOSE_BRACKET) || this.match(TOKEN_COLON)) {
                                // Empty argument: [start:] or [start::step]
                                args.push(null);
                            } else {
                                args.push(this.parseExpression());
                            }
                        }

                        this.consume(TOKEN_CLOSE_BRACKET);

                        if (isSliceNotation) {
                            expr = build.SliceNotation(expr, args);
                        } else {
                            // Regular array access [index]
                            expr = build.Pick(expr, args[0]);
                        }
                    }
                    break;

                case TOKEN_ORDER:
                    // Handle ORDER tokens (asc/desc) for compare expressions
                    expr = build.Compare(expr, this.consumeValue());
                    break;

                default:
                    return expr; // End of postfix chain
            }
        }

        return expr;
    }

    parseAssertion() {
        let negation = false;

        // Handle 'not' negation
        if (this.matchAdvance(TOKEN_NOT)) {
            negation = true;
        }

        // Handle parentheses around assertion expression: is (complex_assertion)
        if (this.matchAdvance(TOKEN_OPEN_PAREN)) {
            const assertion = this.parseAssertionExpression();
            this.consume(TOKEN_CLOSE_PAREN); // consume ')'

            if (negation) {
                // Apply outer negation to the complex assertion
                return this.negateAssertion(assertion);
            }
            return assertion;
        }

        // Handle direct identifier: is name or is not name
        switch (this.current.type) {
            case TOKEN_IDENT:
                return build.Assertion(build.Identifier(this.consumeValue()), negation);

            case TOKEN_LITERAL:
                // Handle literal assertion names: is null, is undefined, etc.
                return build.Assertion(build.Identifier(String(this.consumeValue())), negation);

            case TOKEN_$IDENT:
                // Handle $identifier references: is $myAssertion
                return build.Assertion(build.Reference(this.consumeValue()), negation);

            default:
                this.throwError('Expected assertion term');
        }
    }

    // Parse complex assertion expressions with boolean logic
    parseAssertionExpression() {
        return this.parseAssertionOr();
    }

    parseAssertionOr() {
        let left = this.parseAssertionAnd();

        while (this.matchAdvance(TOKEN_OR)) {
            left = build.Binary('or', left, this.parseAssertionAnd());
        }

        return left;
    }

    parseAssertionAnd() {
        let left = this.parseAssertionTerm();

        while (this.matchAdvance(TOKEN_AND)) {
            left = build.Binary('and', left, this.parseAssertionTerm());
        }

        return left;
    }

    parseAssertionTerm() {
        switch (this.current.type) {
            case TOKEN_NOT:
                // Handle 'not' negation within complex assertions
                this.advance();
                const term = this.parseAssertionTerm();
                return this.negateAssertion(term);

            case TOKEN_OPEN_PAREN:
                // Handle nested parentheses
                this.advance();
                const assertion = this.parseAssertionExpression();
                this.consume(TOKEN_CLOSE_PAREN);
                return assertion;

            case TOKEN_IDENT:
                // Handle simple assertion terms
                return build.Assertion(build.Identifier(this.consumeValue()), false);

            case TOKEN_LITERAL:
                return build.Assertion(build.Identifier(String(this.consumeValue())), false);

            case TOKEN_$IDENT:
                // Handle $identifier references in assertion terms
                return build.Assertion(build.Reference(this.consumeValue()), false);

            default:
                this.throwError('Expected assertion term');
        }
    }

    negateAssertion(assertion) {
        if (assertion.type === 'Assertion') {
            return build.Assertion(assertion.assertion, !assertion.negation);
        } else {
            // For complex expressions, wrap in a negation
            return build.Prefix('not', assertion);
        }
    }

    parseMethodCall(tokenType) {
        if (tokenType !== TOKEN_METHOD_OPEN && tokenType !== TOKEN_$METHOD_OPEN) {
            this.throwError('Expected token type for method call');
        }

        // Extract method name based on token type
        const methodName = tokenType === TOKEN_$METHOD_OPEN
            ? this.consumeValue().slice(1, -1)  // Remove $ prefix and ( suffix
            : this.consumeValue().slice(0, -1); // Remove ( suffix only

        const args = [];
        if (!this.match(TOKEN_CLOSE_PAREN)) {
            do {
                args.push(this.parseExpression());
            } while (this.matchAdvance(TOKEN_COMMA));
        }

        this.consume(TOKEN_CLOSE_PAREN);

        // Create appropriate identifier node
        const identifier = tokenType === TOKEN_$METHOD_OPEN
            ? build.Reference(build.Identifier(methodName))
            : build.Identifier(methodName);

        return build.Method(identifier, args);
    }

    parse$MethodCall() {
        return this.parseMethodCall(TOKEN_$METHOD_OPEN);
    }

    parseTemplate() {
        if (this.match(TOKEN_TEMPLATE)) {
            return build.Template([this.consumeValue()]);
        }

        const parts = [
            // Start with TPL_START token
            build.Literal(this.consumeValue(TOKEN_TPL_START))
        ];

        // Parse template expressions and continuations
        while (true) {
            // Parse the expression inside ${}
            parts.push(this.parseExpression());

            if (this.match(TOKEN_TPL_CONTINUE)) {
                parts.push(build.Literal(this.consumeValue(TOKEN_TPL_CONTINUE)));
            } else {
                break;
            }
        }

        // End with TPL_END token
        parts.push(build.Literal(this.consumeValue(TOKEN_TPL_END)));

        return build.Template(parts);
    }

    parsePrimary() {
        switch (this.current.type) {
            case TOKEN_NUMBER:
            case TOKEN_STRING:
            case TOKEN_REGEXP:
            case TOKEN_LITERAL:
                return build.Literal(this.consumeValue());

            case TOKEN_TEMPLATE:
            case TOKEN_TPL_START:
                return this.parseTemplate();

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

            case TOKEN_$IDENT: {
                const tokenValue = this.consumeValue();

                // Check if this is a single-parameter arrow function: $param => body
                if (this.matchAdvance(TOKEN_ARROW)) {
                    return this.parseSingleParameterArrowFunction(tokenValue);
                }

                return build.Reference(tokenValue);
            }

            case TOKEN_IDENT:
                return this.property(this.consumeValue());

            case TOKEN_METHOD_OPEN:
                return build.MethodCall(null, this.parseMethodCall(TOKEN_METHOD_OPEN));

            case TOKEN_$METHOD_OPEN:
                return build.MethodCall(null, this.parseMethodCall(TOKEN_$METHOD_OPEN));

            case TOKEN_DOT:
                this.advance();
                switch (this.current.type) {
                    case TOKEN_IDENT:
                        return this.property(this.consumeValue());
                    case TOKEN_METHOD_OPEN:
                        return this.parseMethodCall(TOKEN_METHOD_OPEN);
                    case TOKEN_$METHOD_OPEN:
                        return this.parseMethodCall(TOKEN_$METHOD_OPEN);
                    case TOKEN_OPEN_PAREN:
                        return this.parseMapFromParen(null);
                    case TOKEN_OPEN_BRACKET:
                        return this.parseFilterFromBracket(null);
                    default:
                        this.throwError('Expected property name after dot');
                }
                break;

            case TOKEN_DOT_OPEN_PAREN:
                return this.parseMap(null);

            case TOKEN_DOT_OPEN_BRACKET:
                return this.parseFilter(null);

            case TOKEN_DOT_DOT:
                this.advance();
                if (this.match(TOKEN_IDENT)) {
                    return this.parseMapRecursive(null, this.property(this.consumeValue()));
                } else {
                    this.throwError('Expected property name after ..');
                }
                break;

            case TOKEN_OPEN_BRACKET:
                return this.maybe(this.parseSliceNotation) || this.parseArray();

            case TOKEN_OPEN_BRACE:
                return this.parseObject();

            case TOKEN_OPEN_PAREN:
                return this.maybe(this.parseLambda) || this.parseParentheses();

            case TOKEN_PIPE:
                return this.parsePipeline(null, 0);

            default:
                return build.Placeholder();
        }
    }

    parseLambda() {
        this.consume(TOKEN_OPEN_PAREN);

        // Parse parameter list
        const params = [];
        if (!this.match(TOKEN_CLOSE_PAREN)) {
            do {
                if (this.match(TOKEN_$IDENT)) {
                    params.push(build.Identifier(this.consumeValue().slice(1))); // Remove $ prefix
                } else {
                    this.throwError('Expected parameter name in lambda function');
                }
            } while (this.matchAdvance(TOKEN_COMMA));
        }

        this.consume(TOKEN_CLOSE_PAREN);
        this.consume(TOKEN_ARROW);

        return build.Function(
            params,
            build.Block([], this.parseExpression())
        );
    }

    parseParentheses() {
        this.consume(TOKEN_OPEN_PAREN);
        const block = this.parseBlock();
        this.consume(TOKEN_CLOSE_PAREN);
        return build.Parentheses(block);
    }

    parseArray() {
        this.consume(TOKEN_OPEN_BRACKET);

        // Check if empty bracket (empty array)
        if (this.matchAdvance(TOKEN_CLOSE_BRACKET)) {
            return build.Array([]);
        }

        // Otherwise parse as array literal
        const elements = [];
        do {
            elements.push(this.parseArrayElement());
        } while (this.matchAdvance(TOKEN_COMMA) && !this.match(TOKEN_CLOSE_BRACKET));

        this.consume(TOKEN_CLOSE_BRACKET);
        return build.Array(elements);
    }

    parseSliceNotation() {
        this.consume(TOKEN_OPEN_BRACKET);

        const args = [];

        // Handle initial empty position [:...]
        if (this.match(TOKEN_COLON)) {
            args.push(null);
        } else {
            args.push(this.parseExpression());
        }

        // Must have at least one colon for slice notation
        if (!this.match(TOKEN_COLON)) {
            this.throwError('Not slice notation');
        }

        // Parse colons and additional arguments
        while (args.length < 3 && this.matchAdvance(TOKEN_COLON)) {
            if (this.match(TOKEN_CLOSE_BRACKET) || this.match(TOKEN_COLON)) {
                args.push(null);
            } else {
                args.push(this.parseExpression());
            }
        }

        this.consume(TOKEN_CLOSE_BRACKET);
        return build.SliceNotation(null, args);
    }

    parseArrayElement() {
        // Handle spread syntax
        if (this.match(TOKEN_DOT_DOT_DOT)) {
            return this.parseSpread(true);
        }

        return this.parseExpression();
    }

    parseObject() {
        this.consume(TOKEN_OPEN_BRACE);
        const entries = [];

        if (!this.match(TOKEN_CLOSE_BRACE)) {
            entries.push(this.parseObjectEntry());

            while (this.matchAdvance(TOKEN_COMMA)) {
                if (!this.match(TOKEN_CLOSE_BRACE)) { // allow trailing comma
                    entries.push(this.parseObjectEntry());
                }
            }
        }

        this.consume(TOKEN_CLOSE_BRACE);
        return build.Object(entries);
    }

    parseObjectEntry() {
        // Handle spread syntax: ...expression
        if (this.match(TOKEN_DOT_DOT_DOT)) {
            return this.parseSpread(false); // false for object spread vs array spread
        }

        let key;

        switch (this.current.type) {
            case TOKEN_IDENT:
                key = build.Identifier(this.consumeValue());
                break;

            case TOKEN_$IDENT:
                key = build.Reference(this.consumeValue());
                break;

            case TOKEN_$:
                this.advance();
                key = build.Current();
                break;

            case TOKEN_STRING:
            case TOKEN_NUMBER:
            case TOKEN_LITERAL:
                key = build.Literal(this.consumeValue());
                break;

            case TOKEN_OPEN_BRACKET:
                // Computed property name: [expression]
                this.advance();
                key = this.parseExpression();
                this.consume(TOKEN_CLOSE_BRACKET); // consume ]
                break;

            default:
                this.throwError('Expected object property name');
        }

        if (this.matchAdvance(TOKEN_COLON)) {
            return build.ObjectEntry(key, this.parseExpression());
        }

        // Shorthand property
        return build.ObjectEntry(key, null);
    }

    // Dedicated parse methods for single AST node creation
    parseMap(value) {
        this.consume(TOKEN_DOT_OPEN_PAREN);
        const query = this.parseBlock();
        this.consume(TOKEN_CLOSE_PAREN);
        return build.Map(value, query);
    }

    parseFilter(value) {
        this.consume(TOKEN_DOT_OPEN_BRACKET);
        const query = this.parseBlock();
        this.consume(TOKEN_CLOSE_BRACKET);
        return build.Filter(value, query);
    }

    parseMapRecursive(value, property = null) {
        if (property) {
            return build.MapRecursive(value, property);
        }

        this.consume(TOKEN_DOT_DOT_OPEN_PAREN);
        const query = this.parseBlock();
        this.consume(TOKEN_CLOSE_PAREN);
        return build.MapRecursive(value, query);
    }

    parsePick(value, index = null) {
        if (index !== undefined) {
            return build.Pick(value, index);
        }

        this.consume(TOKEN_OPEN_BRACKET);
        if (this.matchAdvance(TOKEN_CLOSE_BRACKET)) {
            return build.Pick(value, null);
        }

        const indexExpr = this.parseExpression();
        this.consume(TOKEN_CLOSE_BRACKET);
        return build.Pick(value, indexExpr);
    }

    parseSpread(isArray) {
        this.consume(TOKEN_DOT_DOT_DOT);
        return build.Spread(this.parseExpression(), isArray);
    }

    parsePipeline(left, precedence) {
        this.consume(TOKEN_PIPE);
        return build.Pipeline(left, this.parseExpression(precedence));
    }

    parseSingleParameterArrowFunction(tokenValue) {
        const body = this.parseExpression();
        const param = build.Declarator(tokenValue.slice(1)); // Remove $ prefix
        return build.Function([param], build.Block([], body));
    }

    parseNoParameterArrowFunction() {
        return build.Function([], this.parseExpression());
    }

    parseTernaryConditional(condition, prec, rightAssoc) {
        const consequent = this.parseExpression();
        this.advance(); // consume ':'
        const alternate = this.parseExpression(prec + (rightAssoc ? 0 : 1));
        return build.Conditional(condition, consequent, alternate);
    }

    parseAssertionPostfix(left) {
        return build.Postfix(left, this.parseAssertion());
    }

    parseBinaryOperator(operator, left, prec, rightAssoc) {
        const right = this.parseExpression(prec + (rightAssoc ? 0 : 1));
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

    parseParentheses() {
        this.consume(TOKEN_OPEN_PAREN);
        const block = this.parseBlock();
        this.consume(TOKEN_CLOSE_PAREN);
        return build.Parentheses(block);
    }

    // Specialized versions for different opening token types
    parseMapFromParen(value) {
        this.consume(TOKEN_OPEN_PAREN);
        const query = this.parseBlock();
        this.consume(TOKEN_CLOSE_PAREN);
        return build.Map(value, query);
    }

    parseFilterFromBracket(value) {
        this.consume(TOKEN_OPEN_BRACKET);
        const query = this.parseBlock();
        this.consume(TOKEN_CLOSE_BRACKET);
        return build.Filter(value, query);
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
