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

    peek() {
        // Save current position
        const savedPos = this.tokenizer.pos;
        const savedBracketStack = [...this.tokenizer.bracketStack];

        // Get next token
        const nextToken = this.tokenizer.nextToken();

        // Restore position
        this.tokenizer.pos = savedPos;
        this.tokenizer.bracketStack = savedBracketStack;

        return nextToken.type;
    }

    match(type) {
        return this.current.type === type;
    }

    matchAdvance(type) {
        return this.current.type === type
            ? this.advance()
            : null;
    }

    // Helper to create property access nodes
    property(name, obj = null) {
        return build.GetProperty(obj, build.Identifier(name));
    }

    consume(expectedType) {
        if (expectedType === undefined || this.current.type === expectedType) {
            const token = this.current;
            this.advance();
            return token;
        }

        throw new Error(`Expected \`${tokenNames[expectedType]}\`, got \`${tokenNames[this.current.type]}\``); //  at position ${this.current.offset}
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
            throw new Error('Expected definition');
        }

        if (this.match(TOKEN_COLON)) {
            this.advance(); // consume ':'
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
                    const alternate = this.parseExpression(prec + (rightAssoc ? 0 : 1));
                    left = build.Conditional(left, consequent, alternate);
                    break;
                }
                case TOKEN_PIPE: {
                    // Pipeline operator
                    const right = this.parseExpression(prec + (rightAssoc ? 0 : 1));
                    left = build.Pipeline(left, right);
                    break;
                }
                case TOKEN_IS: {
                    // Assertion operator
                    const assertion = this.parseAssertion();
                    left = build.Postfix(left, assertion);
                    break;
                }
                default: {
                    // Binary operators
                    const right = this.parseExpression(prec + (rightAssoc ? 0 : 1));
                    left = build.Binary(op.value, left, right);
                }
            }
        }

        return left;
    }

    parseUnary() {
        // Unary prefix operators
        if (this.match(TOKEN_NOT) || this.match(TOKEN_NO) || this.match(TOKEN_PLUS) || this.match(TOKEN_MINUS)) {
            const op = this.consumeValue();
            const expr = this.parseUnary();
            return build.Prefix(op, expr);
        }

        // IS assertions as prefix
        if (this.match(TOKEN_IS)) {
            const op = this.consumeValue();
            const assertion = this.parseAssertion();
            return build.Prefix(op, assertion);
        }

        // Arrow functions without parameters
        if (this.match(TOKEN_ARROW)) {
            this.advance();
            const body = this.parseExpression();
            return build.Function([], body);
        }

        return this.parsePostfix();
    }

    parsePostfix() {
        let expr = this.parsePrimary();

        while (!this.match(TOKEN_EOF)) {
            if (this.matchAdvance(TOKEN_DOT)) {
                if (this.match(TOKEN_IDENT)) {
                    const propName = this.consumeValue();
                    expr = this.property(propName, expr);
                } else if (this.match(TOKEN_METHOD_OPEN)) {
                    const method = this.parseMethodCall();
                    expr = build.MethodCall(expr, method);
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
                    const propName = this.consumeValue();
                    expr = build.MapRecursive(expr, this.property(propName));
                } else if (this.match(TOKEN_METHOD_OPEN)) {
                    const method = this.parseMethodCall();
                    expr = build.MapRecursive(expr, build.MethodCall(null, method));
                } else {
                    break;
                }
            } else if (this.matchAdvance(TOKEN_DOT_DOT_OPEN_PAREN)) {
                // ..( block ) - Recursive map operation
                const block = this.parseBlock();
                this.consume(TOKEN_CLOSE_PAREN);
                expr = build.MapRecursive(expr, block);
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
                    while (this.match(TOKEN_COLON)) {
                        this.advance(); // consume ':'
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
                const orderToken = this.consumeValue();
                expr = build.Compare(expr, orderToken);
            } else {
                break;
            }
        }

        return expr;
    }

    parseAssertion() {
        let negation = false;

        // Handle 'not' negation
        if (this.match(TOKEN_NOT)) {
            this.advance();
            negation = true;
        }

        // Handle parentheses around assertion expression: is (complex_assertion)
        if (this.match(TOKEN_OPEN_PAREN)) {
            this.advance(); // consume '('
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
            const name = this.consumeValue();
            return build.Assertion(build.Identifier(name), negation);
        }

        // Handle literal assertion names: is null, is undefined, etc.
        if (this.match(TOKEN_LITERAL)) {
            const name = this.consumeValue();
            return build.Assertion(build.Identifier(String(name)), negation);
        }

        // Handle $identifier references: is $myAssertion
        if (this.match(TOKEN_$IDENT)) {
            const ref = this.consumeValue();
            return build.Assertion(build.Reference(ref), negation);
        }

        throw new Error('Expected assertion term');
    }

    // Parse complex assertion expressions with boolean logic
    parseAssertionExpression() {
        return this.parseAssertionOr();
    }

    parseAssertionOr() {
        let left = this.parseAssertionAnd();

        while (this.match(TOKEN_OR)) {
            this.advance();
            const right = this.parseAssertionAnd();
            left = build.Binary('or', left, right);
        }

        return left;
    }

    parseAssertionAnd() {
        let left = this.parseAssertionTerm();

        while (this.match(TOKEN_AND)) {
            this.advance();
            const right = this.parseAssertionTerm();
            left = build.Binary('and', left, right);
        }

        return left;
    }

    parseAssertionTerm() {
        // Handle 'not' negation within complex assertions
        if (this.match(TOKEN_NOT)) {
            this.advance();
            const term = this.parseAssertionTerm();
            return this.negateAssertion(term);
        }

        // Handle nested parentheses
        if (this.match(TOKEN_OPEN_PAREN)) {
            this.advance();
            const assertion = this.parseAssertionExpression();
            this.consume(TOKEN_CLOSE_PAREN);
            return assertion;
        }

        // Handle simple assertion terms
        if (this.match(TOKEN_IDENT)) {
            const name = this.consumeValue();
            return build.Assertion(build.Identifier(name), false);
        }

        if (this.match(TOKEN_LITERAL)) {
            const name = this.consumeValue();
            return build.Assertion(build.Identifier(String(name)), false);
        }

        // Handle $identifier references in assertion terms
        if (this.match(TOKEN_$IDENT)) {
            const ref = this.consumeValue();
            return build.Assertion(build.Reference(ref), false);
        }

        throw new Error('Expected assertion term');
    }

    negateAssertion(assertion) {
        if (assertion.type === 'Assertion') {
            return build.Assertion(assertion.assertion, !assertion.negation);
        } else {
            // For complex expressions, wrap in a negation
            return build.Prefix('not', assertion);
        }
    }

    parseMethodCall() {
        const nameValue = this.consumeValue(TOKEN_METHOD_OPEN);
        // The TOKEN_METHOD_OPEN already includes the opening parenthesis
        // Extract method name by removing the trailing '('
        const methodName = nameValue.slice(0, -1);

        const args = [];
        if (!this.match(TOKEN_CLOSE_PAREN)) {
            do {
                args.push(this.parseExpression());
            } while (this.matchAdvance(TOKEN_COMMA));
        }

        this.consume(TOKEN_CLOSE_PAREN);
        return build.Method(build.Identifier(methodName), args);
    }

    parse$MethodCall() {
        const name = this.consume(TOKEN_$METHOD_OPEN);
        // Remove the $ prefix and ( suffix from the token value
        const methodName = name.value.slice(1, -1);

        const args = [];
        if (!this.match(TOKEN_CLOSE_PAREN)) {
            do {
                args.push(this.parseExpression());
            } while (this.match(TOKEN_COMMA) && this.consume());
        }

        this.consume(TOKEN_CLOSE_PAREN);
        return build.Method(build.Reference(build.Identifier(methodName)), args);
    }

    parseComplexTemplate() {
        const parts = [];

        // Start with TPL_START token
        const start = this.consume(TOKEN_TPL_START);
        parts.push(build.Literal(start.value));

        // Parse template expressions and continuations
        while (true) {
            // Parse the expression inside ${}
            parts.push(this.parseExpression());

            if (this.match(TOKEN_TPL_CONTINUE)) {
                const cont = this.consume(TOKEN_TPL_CONTINUE);
                parts.push(build.Literal(cont.value));
            } else {
                break;
            }
        }

        // End with TPL_END token
        const end = this.consume(TOKEN_TPL_END);
        parts.push(build.Literal(end.value));

        return build.Template(parts);
    }

    parsePrimary() {
        // Literals (number, string, regexp, literal values)
        if (this.match(TOKEN_NUMBER) || this.match(TOKEN_STRING) ||
            this.match(TOKEN_REGEXP) || this.match(TOKEN_LITERAL)) {
            const value = this.consumeValue();
            return build.Literal(value);
        }

        // Template literals
        if (this.match(TOKEN_TEMPLATE)) {
            const value = this.consumeValue();
            return build.Template(value);
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
            if (this.match(TOKEN_ARROW)) {
                this.advance(); // consume '=>'
                const body = this.parseExpression();
                const param = build.Declarator(tokenValue.slice(1)); // Remove $ prefix
                return build.Function([param], build.Block([], body));
            }

            return build.Reference(tokenValue);
        }

        // Identifiers (property access)
        if (this.match(TOKEN_IDENT)) {
            const value = this.consumeValue();
            return this.property(value);
        }

        // Method calls
        if (this.match(TOKEN_METHOD_OPEN)) {
            const method = this.parseMethodCall();
            return build.MethodCall(null, method);
        }

        // $Method calls
        if (this.match(TOKEN_$METHOD_OPEN)) {
            const method = this.parse$MethodCall();
            return build.MethodCall(null, method);
        }

        // Complex template literals
        if (this.match(TOKEN_TPL_START)) {
            return this.parseComplexTemplate();
        }

        // Dot notation (shorthand for @.property or map operations)
        if (this.matchAdvance(TOKEN_DOT)) {
            if (this.match(TOKEN_IDENT)) {
                const propName = this.consumeValue();
                return this.property(propName);
            } else if (this.match(TOKEN_METHOD_OPEN)) {
                // Method call on implicit data root .method(...)
                const methodToken = this.consume(TOKEN_METHOD_OPEN);
                const methodName = methodToken.value.slice(0, -1); // Remove trailing '('

                const args = [];
                if (!this.match(TOKEN_CLOSE_PAREN)) {
                    do {
                        args.push(this.parseExpression());
                    } while (this.match(TOKEN_COMMA) && this.consume());
                }

                this.consume(TOKEN_CLOSE_PAREN);
                return build.Method(build.Identifier(methodName), args);
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
                throw new Error('Expected property name after dot');
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
                const propName = this.consumeValue();
                return build.MapRecursive(null, this.property(propName));
            } else {
                throw new Error('Expected property name after ..');
            }
        }

        // Arrays
        if (this.match(TOKEN_OPEN_BRACKET)) {
            return this.parseArray();
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
        if (this.match(TOKEN_PIPE)) {
            this.advance();
            const right = this.parseExpression();
            return build.Pipeline(null, right);
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
                    const param = this.consumeValue();
                    params.push(build.Declarator(param.slice(1))); // Remove $ prefix
                } else {
                    throw new Error('Expected parameter name in lambda function');
                }
            } while (this.matchAdvance(TOKEN_COMMA));
        }

        this.consume(TOKEN_CLOSE_PAREN);
        this.consume(TOKEN_ARROW);

        const body = this.parseExpression();
        return build.Function(params, build.Block([], body));
    }

    parseParentheses() {
        this.consume(TOKEN_OPEN_PAREN);
        const block = this.parseBlock();
        this.consume(TOKEN_CLOSE_PAREN);
        return build.Parentheses(block);
    }

    parseArray() {
        this.consume(TOKEN_OPEN_BRACKET);

        // Check if this is slice notation starting with colon
        if (this.match(TOKEN_COLON)) {
            return this.parseStandaloneSliceNotation();
        }

        // Check if empty bracket (empty array)
        if (this.match(TOKEN_CLOSE_BRACKET)) {
            this.consume(TOKEN_CLOSE_BRACKET);
            return build.Array([]);
        }

        // Parse first element/expression to check if it's slice notation or array
        let firstElement;

        // If it starts with spread, it's definitely an array
        if (this.match(TOKEN_DOT_DOT_DOT)) {
            firstElement = this.parseArrayElement();
            // Continue with array parsing
            const elements = [firstElement];

            while (this.match(TOKEN_COMMA)) {
                this.advance(); // consume comma
                if (!this.match(TOKEN_CLOSE_BRACKET)) { // allow trailing comma
                    elements.push(this.parseArrayElement());
                }
            }

            this.consume(TOKEN_CLOSE_BRACKET);
            return build.Array(elements);
        }

        // Parse first expression to check for slice notation
        firstElement = this.parseExpression();

        // Check if followed by colon (slice notation)
        if (this.match(TOKEN_COLON)) {
            return this.parseStandaloneSliceNotationWithFirst(firstElement);
        }

        // Otherwise it's an array literal
        const elements = [firstElement];

        while (this.match(TOKEN_COMMA)) {
            this.advance(); // consume comma
            if (!this.match(TOKEN_CLOSE_BRACKET)) { // allow trailing comma
                elements.push(this.parseArrayElement());
            }
        }

        this.consume(TOKEN_CLOSE_BRACKET);
        return build.Array(elements);
    }

    parseStandaloneSliceNotationWithFirst(firstArg) {
        // Parse slice notation starting with: [firstArg:...]
        const args = [firstArg];

        // Parse colons and additional arguments
        while (this.match(TOKEN_COLON)) {
            this.advance(); // consume ':'

            if (this.match(TOKEN_CLOSE_BRACKET) || this.match(TOKEN_COLON)) {
                // Empty argument: [start:] or [start::step]
                args.push(null);
            } else {
                args.push(this.parseExpression());
            }
        }

        this.consume(TOKEN_CLOSE_BRACKET);
        return build.SliceNotation(null, args);
    }

    parseStandaloneSliceNotation() {
        // Parse slice notation starting with colon: [:end:step]
        const args = [];

        // Parse first argument (must be null since we start with colon)
        args.push(null);

        // Parse colons and additional arguments
        while (this.match(TOKEN_COLON)) {
            this.advance(); // consume ':'

            if (this.match(TOKEN_CLOSE_BRACKET) || this.match(TOKEN_COLON)) {
                // Empty argument: [:] or [::step]
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
            this.advance();
            const query = this.parseExpression();
            return build.Spread(query, true);
        }

        return this.parseExpression();
    }

    parseObject() {
        this.consume(TOKEN_OPEN_BRACE);
        const entries = [];

        if (!this.match(TOKEN_CLOSE_BRACE)) {
            entries.push(this.parseObjectEntry());

            while (this.match(TOKEN_COMMA)) {
                this.advance(); // consume comma
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
            this.advance(); // consume '...'
            const query = this.parseExpression();
            return build.Spread(query, false); // false for object spread vs array spread
        }

        let key;

        if (this.match(TOKEN_IDENT)) {
            key = build.Identifier(this.consumeValue());
        } else if (this.match(TOKEN_$IDENT)) {
            key = build.Reference(this.consumeValue());
        } else if (this.matchAdvance(TOKEN_$)) {
            key = build.Current();
        } else if (this.match(TOKEN_STRING) || this.match(TOKEN_NUMBER)) {
            const value = this.consumeValue();
            key = build.Literal(value);
        } else if (this.match(TOKEN_LITERAL)) {
            // Handle literal property names: true, false, null, undefined, etc.
            const value = this.consumeValue();
            key = build.Literal(value);
        } else if (this.matchAdvance(TOKEN_OPEN_BRACKET)) {
            // Computed property name: [expression]
            key = this.parseExpression();
            this.consume(TOKEN_CLOSE_BRACKET); // consume ]
        } else {
            throw new Error('Expected object property name');
        }

        if (this.match(TOKEN_COLON)) {
            this.advance();
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
