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
        let name = null;
        let value = null;

        // Try to parse a definition
        if (this.match(TOKEN_$IDENT)) {
            name = this.consumeValue().slice(1); // Remove $ prefix
        } else if (this.match(TOKEN_$)) {
            // name remains null for anonymous definition
            this.advance(); // consume '$'
        } else {
            this.throwError('Expected definition');
        }

        if (this.matchAdvance(TOKEN_COLON)) {
            value = this.parseExpression();
        }

        this.consume(TOKEN_SEMICOLON); // consume ';'

        return build.Definition(build.Declarator(name), value);
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
                    const consequent = this.parseExpression();
                    this.advance(); // consume ':'
                    left = build.Conditional(left, consequent, this.parseExpression(prec + (rightAssoc ? 0 : 1)));
                    break;
                }
                case TOKEN_PIPE: {
                    // Pipeline operator
                    left = build.Pipeline(left, this.parseExpression(prec + (rightAssoc ? 0 : 1)));
                    break;
                }
                case TOKEN_IS: {
                    // Assertion operator
                    left = build.Postfix(left, this.parseAssertion());
                    break;
                }
                default: {
                    // Binary operators
                    left = build.Binary(op.value, left, this.parseExpression(prec + (rightAssoc ? 0 : 1)));
                }
            }
        }

        return left;
    }

    parseUnary() {
        // Unary prefix operators
        if (this.match(TOKEN_NOT) || this.match(TOKEN_NO) || this.match(TOKEN_PLUS) || this.match(TOKEN_MINUS)) {
            return build.Prefix(
                this.consumeValue(),
                this.parseUnary()
            );
        }

        // IS assertions as prefix
        if (this.match(TOKEN_IS)) {
            return build.Prefix(
                this.consumeValue(),
                this.parseAssertion()
            );
        }

        // Arrow functions without parameters
        if (this.matchAdvance(TOKEN_ARROW)) {
            return build.Function([], this.parseExpression());
        }

        return this.parsePostfix();
    }

    parsePostfix() {
        let expr = this.parsePrimary();

        while (!this.match(TOKEN_EOF)) {
            if (this.matchAdvance(TOKEN_DOT)) {
                if (this.match(TOKEN_IDENT)) {
                    expr = this.property(this.consumeValue(), expr);
                } else if (this.match(TOKEN_METHOD_OPEN)) {
                    expr = build.MethodCall(expr, this.parseMethodCall());
                } else {
                    break;
                }
            } else if (this.matchAdvance(TOKEN_DOT_OPEN_PAREN)) {
                // .( block ) - Map operation
                expr = build.Map(expr, this.parseBlock());
                this.consume(TOKEN_CLOSE_PAREN);
            } else if (this.matchAdvance(TOKEN_DOT_OPEN_BRACKET)) {
                // .[ block ] - Filter operation
                expr = build.Filter(expr, this.parseBlock());
                this.consume(TOKEN_CLOSE_BRACKET);
            } else if (this.matchAdvance(TOKEN_DOT_DOT)) {
                if (this.match(TOKEN_IDENT)) {
                    expr = build.MapRecursive(expr, this.property(this.consumeValue()));
                } else if (this.match(TOKEN_METHOD_OPEN)) {
                    expr = build.MapRecursive(expr, build.MethodCall(null, this.parseMethodCall()));
                } else {
                    break;
                }
            } else if (this.matchAdvance(TOKEN_DOT_DOT_OPEN_PAREN)) {
                // ..( block ) - Recursive map operation
                expr = build.MapRecursive(expr, this.parseBlock());
                this.consume(TOKEN_CLOSE_PAREN);
            } else if (this.matchAdvance(TOKEN_OPEN_BRACKET)) {

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
            } else if (this.match(TOKEN_ORDER)) {
                // Handle ORDER tokens (asc/desc) for compare expressions
                expr = build.Compare(expr, this.consumeValue());
            } else {
                break;
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
        if (this.match(TOKEN_IDENT)) {
            return build.Assertion(build.Identifier(this.consumeValue()), negation);
        }

        // Handle literal assertion names: is null, is undefined, etc.
        if (this.match(TOKEN_LITERAL)) {
            return build.Assertion(build.Identifier(String(this.consumeValue())), negation);
        }

        // Handle $identifier references: is $myAssertion
        if (this.match(TOKEN_$IDENT)) {
            return build.Assertion(build.Reference(this.consumeValue()), negation);
        }

        this.throwError('Expected assertion term');
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
        // Handle 'not' negation within complex assertions
        if (this.matchAdvance(TOKEN_NOT)) {
            const term = this.parseAssertionTerm();
            return this.negateAssertion(term);
        }

        // Handle nested parentheses
        if (this.matchAdvance(TOKEN_OPEN_PAREN)) {
            const assertion = this.parseAssertionExpression();
            this.consume(TOKEN_CLOSE_PAREN);
            return assertion;
        }

        // Handle simple assertion terms
        if (this.match(TOKEN_IDENT)) {
            return build.Assertion(build.Identifier(this.consumeValue()), false);
        }

        if (this.match(TOKEN_LITERAL)) {
            return build.Assertion(build.Identifier(String(this.consumeValue())), false);
        }

        // Handle $identifier references in assertion terms
        if (this.match(TOKEN_$IDENT)) {
            return build.Assertion(build.Reference(this.consumeValue()), false);
        }

        this.throwError('Expected assertion term');
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

    parseComplexTemplate() {
        const parts = [
            // Start with TPL_START token
            build.Literal(this.consume(TOKEN_TPL_START).value)
        ];

        // Parse template expressions and continuations
        while (true) {
            // Parse the expression inside ${}
            parts.push(this.parseExpression());

            if (this.match(TOKEN_TPL_CONTINUE)) {
                parts.push(build.Literal(this.consume(TOKEN_TPL_CONTINUE).value));
            } else {
                break;
            }
        }

        // End with TPL_END token
        parts.push(build.Literal(this.consume(TOKEN_TPL_END).value));

        return build.Template(parts);
    }

    parsePrimary() {
        // Literals (number, string, regexp, literal values)
        if (this.match(TOKEN_NUMBER) || this.match(TOKEN_STRING) ||
            this.match(TOKEN_REGEXP) || this.match(TOKEN_LITERAL)) {
            return build.Literal(this.consumeValue());
        }

        // Template literals
        if (this.match(TOKEN_TEMPLATE)) {
            return build.Template(this.consumeValue());
        }

        // Special references
        if (this.matchAdvance(TOKEN_AT)) {
            return build.Data();
        }

        if (this.matchAdvance(TOKEN_HASH)) {
            return build.Context();
        }

        if (this.matchAdvance(TOKEN_$)) {
            return build.Current();
        }

        if (this.matchAdvance(TOKEN_$$)) {
            return build.Arg1();
        }

        if (this.match(TOKEN_$IDENT)) {
            const tokenValue = this.consumeValue();

            // Check if this is a single-parameter arrow function: $param => body
            if (this.matchAdvance(TOKEN_ARROW)) {
                const body = this.parseExpression();
                const param = build.Declarator(tokenValue.slice(1)); // Remove $ prefix
                return build.Function([param], build.Block([], body));
            }

            return build.Reference(tokenValue);
        }

        // Identifiers (property access)
        if (this.match(TOKEN_IDENT)) {
            return this.property(this.consumeValue());
        }

        // Method calls
        if (this.match(TOKEN_METHOD_OPEN)) {
            return build.MethodCall(null, this.parseMethodCall(TOKEN_METHOD_OPEN));
        }

        // $Method calls
        if (this.match(TOKEN_$METHOD_OPEN)) {
            return build.MethodCall(null, this.parseMethodCall(TOKEN_$METHOD_OPEN));
        }

        // Complex template literals
        if (this.match(TOKEN_TPL_START)) {
            return this.parseComplexTemplate();
        }

        // Dot notation (shorthand for @.property or map operations)
        if (this.matchAdvance(TOKEN_DOT)) {
            if (this.match(TOKEN_IDENT)) {
                return this.property(this.consumeValue());
            } else if (this.match(TOKEN_METHOD_OPEN)) {
                // Method call on implicit data root .method(...)
                return this.parseMethodCall(TOKEN_METHOD_OPEN);
            } else if (this.match(TOKEN_$METHOD_OPEN)) {
                // $Method call on implicit data root .$method(...)
                return this.parseMethodCall(TOKEN_$METHOD_OPEN);
            } else if (this.matchAdvance(TOKEN_OPEN_PAREN)) {
                // Map operation .()
                const query = this.parseBlock();
                this.consume(TOKEN_CLOSE_PAREN);
                return build.Map(null, query);
            } else if (this.matchAdvance(TOKEN_OPEN_BRACKET)) {
                // Map with bracket notation .[expr]
                const query = this.parseBlock();
                this.consume(TOKEN_CLOSE_BRACKET);
                return build.Map(null, query);
            } else {
                this.throwError('Expected property name after dot');
            }
        }

        // Direct dot-parentheses notation .( expr ) (shorthand for @.( expr ))
        if (this.matchAdvance(TOKEN_DOT_OPEN_PAREN)) {
            const query = this.parseBlock();
            this.consume(TOKEN_CLOSE_PAREN);
            return build.Map(null, query);
        }

        // Direct dot-bracket notation .[expr] (shorthand for @[expr])
        if (this.matchAdvance(TOKEN_DOT_OPEN_BRACKET)) {
            const query = this.parseBlock();
            this.consume(TOKEN_CLOSE_BRACKET);
            return build.Filter(null, query);
        }

        // Recursive operator ..property
        if (this.matchAdvance(TOKEN_DOT_DOT)) {
            if (this.match(TOKEN_IDENT)) {
                return build.MapRecursive(null, this.property(this.consumeValue()));
            } else {
                this.throwError('Expected property name after ..');
            }
        }

        // Arrays
        if (this.match(TOKEN_OPEN_BRACKET)) {
            return this.maybe(this.parseSliceNotation) || this.parseArray();
        }

        // Objects
        if (this.match(TOKEN_OPEN_BRACE)) {
            return this.parseObject();
        }

        // Parenthesized expressions or lambda functions
        if (this.match(TOKEN_OPEN_PAREN)) {
            return this.maybe(this.parseLambda) || this.parseParentheses();
        }

        // Pipeline without left operand
        if (this.matchAdvance(TOKEN_PIPE)) {
            return build.Pipeline(null, this.parseExpression());
        }

        return build.Placeholder();
    }

    parseLambda() {
        this.consume(TOKEN_OPEN_PAREN);

        // Parse parameter list
        const params = [];
        if (!this.match(TOKEN_CLOSE_PAREN)) {
            do {
                if (this.match(TOKEN_$IDENT)) {
                    params.push(build.Declarator(this.consumeValue().slice(1))); // Remove $ prefix
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
        if (this.matchAdvance(TOKEN_DOT_DOT_DOT)) {
            return build.Spread(this.parseExpression(), true);
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
        if (this.matchAdvance(TOKEN_DOT_DOT_DOT)) {
            return build.Spread(this.parseExpression(), false); // false for object spread vs array spread
        }

        let key;

        if (this.match(TOKEN_IDENT)) {
            key = build.Identifier(this.consumeValue());
        } else if (this.match(TOKEN_$IDENT)) {
            key = build.Reference(this.consumeValue());
        } else if (this.matchAdvance(TOKEN_$)) {
            key = build.Current();
        } else if (
            this.match(TOKEN_STRING) ||
            this.match(TOKEN_NUMBER) ||
            this.match(TOKEN_LITERAL)
        ) {
            key = build.Literal(this.consumeValue());
        } else if (this.matchAdvance(TOKEN_OPEN_BRACKET)) {
            // Computed property name: [expression]
            key = this.parseExpression();
            this.consume(TOKEN_CLOSE_BRACKET); // consume ]
        } else {
            this.throwError('Expected object property name');
        }

        if (this.matchAdvance(TOKEN_COLON)) {
            return build.ObjectEntry(key, this.parseExpression());
        }

        // Shorthand property
        return build.ObjectEntry(key, null);
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
