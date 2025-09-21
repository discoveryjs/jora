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

    consume(expectedType) {
        if (expectedType === undefined || this.current.type === expectedType) {
            const token = this.current;
            this.advance();
            return token;
        }

        throw new Error(`Expected \`${tokenNames[expectedType]}\`, got \`${tokenNames[this.current.type]}\``); //  at position ${this.current.offset}
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
            name = this.consume().value.slice(1); // Remove $ prefix
        } else if (this.match(TOKEN_$)) {
            // name remains null for anonymous definition
            this.consume(); // consume '$'
        } else {
            throw new Error('Expected definition');
        }

        if (this.match(TOKEN_COLON)) {
            this.consume(); // consume ':'
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
                    this.consume(TOKEN_COLON);
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
            const op = this.consume();
            const expr = this.parseUnary();
            return build.Prefix(op.value, expr);
        }

        // IS assertions as prefix
        if (this.match(TOKEN_IS)) {
            const op = this.consume();
            const assertion = this.parseAssertion();
            return build.Prefix(op.value, assertion);
        }

        // Arrow functions without parameters
        if (this.match(TOKEN_ARROW)) {
            this.consume();
            const body = this.parseExpression();
            return build.Function([], body);
        }

        return this.parsePostfix();
    }

    parsePostfix() {
        let expr = this.parsePrimary();

        while (!this.match(TOKEN_EOF)) {
            if (this.match(TOKEN_DOT)) {
                this.advance();

                if (this.match(TOKEN_IDENT)) {
                    const prop = this.consume();
                    expr = build.GetProperty(expr, build.Identifier(prop.value));
                } else if (this.match(TOKEN_METHOD_OPEN)) {
                    const method = this.parseMethodCall();
                    expr = build.MethodCall(expr, method);
                } else {
                    break;
                }
            } else if (this.match(TOKEN_DOT_OPEN_PAREN)) {
                // .( block ) - Map operation
                this.advance();
                const block = this.parseBlock();
                this.consume(TOKEN_CLOSE_PAREN);
                expr = build.Map(expr, block);
            } else if (this.match(TOKEN_DOT_OPEN_BRACKET)) {
                // .[ block ] - Filter operation
                this.advance();
                const block = this.parseBlock();
                this.consume(TOKEN_CLOSE_BRACKET);
                expr = build.Filter(expr, block);
            } else if (this.match(TOKEN_DOT_DOT)) {
                this.advance();

                if (this.match(TOKEN_IDENT)) {
                    const prop = this.consume();
                    expr = build.MapRecursive(expr, build.GetProperty(null, build.Identifier(prop.value)));
                } else if (this.match(TOKEN_METHOD_OPEN)) {
                    const method = this.parseMethodCall();
                    expr = build.MapRecursive(expr, build.MethodCall(null, method));
                } else {
                    break;
                }
            } else if (this.match(TOKEN_DOT_DOT_OPEN_PAREN)) {
                // ..( block ) - Recursive map operation
                this.advance();
                const block = this.parseBlock();
                this.consume(TOKEN_CLOSE_PAREN);
                expr = build.MapRecursive(expr, block);
            } else if (this.match(TOKEN_OPEN_BRACKET)) {
                this.advance();

                if (this.match(TOKEN_CLOSE_BRACKET)) {
                    this.advance();
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
                const orderToken = this.consume();
                expr = build.Compare(expr, orderToken.value);
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
            this.consume();
            negation = true;
        }

        // Handle parentheses around assertion expression: is (complex_assertion)
        if (this.match(TOKEN_OPEN_PAREN)) {
            this.consume(); // consume '('
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
            const name = this.consume();
            return build.Assertion(build.Identifier(name.value), negation);
        }

        // Handle literal assertion names: is null, is undefined, etc.
        if (this.match(TOKEN_LITERAL)) {
            const name = this.consume();
            return build.Assertion(build.Identifier(String(name.value)), negation);
        }

        // Handle $identifier references: is $myAssertion
        if (this.match(TOKEN_$IDENT)) {
            const ref = this.consume();
            return build.Assertion(build.Reference(ref.value), negation);
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
            this.consume();
            const right = this.parseAssertionAnd();
            left = build.Binary('or', left, right);
        }

        return left;
    }

    parseAssertionAnd() {
        let left = this.parseAssertionTerm();

        while (this.match(TOKEN_AND)) {
            this.consume();
            const right = this.parseAssertionTerm();
            left = build.Binary('and', left, right);
        }

        return left;
    }

    parseAssertionTerm() {
        // Handle 'not' negation within complex assertions
        if (this.match(TOKEN_NOT)) {
            this.consume();
            const term = this.parseAssertionTerm();
            return this.negateAssertion(term);
        }

        // Handle nested parentheses
        if (this.match(TOKEN_OPEN_PAREN)) {
            this.consume();
            const assertion = this.parseAssertionExpression();
            this.consume(TOKEN_CLOSE_PAREN);
            return assertion;
        }

        // Handle simple assertion terms
        if (this.match(TOKEN_IDENT)) {
            const name = this.consume();
            return build.Assertion(build.Identifier(name.value), false);
        }

        if (this.match(TOKEN_LITERAL)) {
            const name = this.consume();
            return build.Assertion(build.Identifier(String(name.value)), false);
        }

        // Handle $identifier references in assertion terms
        if (this.match(TOKEN_$IDENT)) {
            const ref = this.consume();
            return build.Assertion(build.Reference(ref.value), false);
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
        const name = this.consume(TOKEN_METHOD_OPEN);
        // The TOKEN_METHOD_OPEN already includes the opening parenthesis
        // Extract method name by removing the trailing '('
        const methodName = name.value.slice(0, -1);

        const args = [];
        if (!this.match(TOKEN_CLOSE_PAREN)) {
            do {
                args.push(this.parseExpression());
            } while (this.match(TOKEN_COMMA) && this.consume());
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
        while (this.match(TOKEN_TPL_CONTINUE) || this.current.type !== TOKEN_TPL_END) {
            if (this.match(TOKEN_TPL_CONTINUE)) {
                const cont = this.consume(TOKEN_TPL_CONTINUE);
                parts.push(build.Literal(cont.value));
            } else {
                // Parse the expression inside ${}
                const expr = this.parseExpression();
                parts.push(expr);
            }
        }

        // End with TPL_END token
        if (this.match(TOKEN_TPL_END)) {
            const end = this.consume(TOKEN_TPL_END);
            parts.push(build.Literal(end.value));
        }

        return build.Template(parts);
    }

    parsePrimary() {
        // Literals
        if (this.match(TOKEN_NUMBER) || this.match(TOKEN_STRING) ||
            this.match(TOKEN_REGEXP) || this.match(TOKEN_LITERAL)) {
            const token = this.consume();
            return build.Literal(token.value);
        }

        // Template literals
        if (this.match(TOKEN_TEMPLATE)) {
            const token = this.consume();
            return build.Template(token.value);
        }

        // Special references
        if (this.match(TOKEN_AT)) {
            this.consume();
            return build.Data();
        }

        if (this.match(TOKEN_HASH)) {
            this.consume();
            return build.Context();
        }

        if (this.match(TOKEN_$)) {
            this.consume();
            return build.Current();
        }

        if (this.match(TOKEN_$$)) {
            this.consume();
            return build.Arg1();
        }

        if (this.match(TOKEN_$IDENT)) {
            const token = this.consume();

            // Check if this is a single-parameter arrow function: $param => body
            if (this.match(TOKEN_ARROW)) {
                this.consume(); // consume '=>'
                const body = this.parseExpression();
                const param = build.Declarator(token.value.slice(1)); // Remove $ prefix
                return build.Function([param], build.Block([], body));
            }

            return build.Reference(token.value);
        }

        // Identifiers (property access)
        if (this.match(TOKEN_IDENT)) {
            const token = this.consume();
            return build.GetProperty(null, build.Identifier(token.value));
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
        if (this.match(TOKEN_DOT)) {
            this.advance();
            if (this.match(TOKEN_IDENT)) {
                const prop = this.consume();
                return build.GetProperty(null, build.Identifier(prop.value));
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
            } else if (this.match(TOKEN_OPEN_PAREN)) {
                // Map operation .()
                this.advance(); // consume (
                const query = this.parseBlock();
                this.consume(TOKEN_CLOSE_PAREN);
                return build.Map(null, query);
            } else if (this.match(TOKEN_OPEN_BRACKET)) {
                // Map with bracket notation .[expr]
                this.advance(); // consume [
                const query = this.parseBlock();
                this.consume(TOKEN_CLOSE_BRACKET);
                return build.Map(null, query);
            } else {
                throw new Error('Expected property name after dot');
            }
        }

        // Direct dot-parentheses notation .( expr ) (shorthand for @.( expr ))
        if (this.match(TOKEN_DOT_OPEN_PAREN)) {
            this.advance(); // consume .(
            const query = this.parseBlock();
            this.consume(TOKEN_CLOSE_PAREN);
            return build.Map(null, query);
        }

        // Direct dot-bracket notation .[expr] (shorthand for @[expr])
        if (this.match(TOKEN_DOT_OPEN_BRACKET)) {
            this.advance(); // consume .[
            const query = this.parseBlock();
            this.consume(TOKEN_CLOSE_BRACKET);
            return build.Filter(null, query);
        }

        // Recursive operator ..property
        if (this.match(TOKEN_DOT_DOT)) {
            this.advance();
            if (this.match(TOKEN_IDENT)) {
                const prop = this.consume();
                return build.MapRecursive(null, build.GetProperty(null, build.Identifier(prop.value)));
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
            this.consume();
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
                    const param = this.consume();
                    params.push(build.Declarator(param.value.slice(1))); // Remove $ prefix
                } else {
                    throw new Error('Expected parameter name in lambda function');
                }
            } while (this.match(TOKEN_COMMA) && this.consume());
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
                this.consume(); // consume comma
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
            this.consume(); // consume comma
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
            this.consume();
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
                this.consume(); // consume comma
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
            this.consume(); // consume '...'
            const query = this.parseExpression();
            return build.Spread(query, false); // false for object spread vs array spread
        }

        let key;

        if (this.match(TOKEN_IDENT)) {
            key = build.Identifier(this.consume().value);
        } else if (this.match(TOKEN_$IDENT)) {
            const token = this.consume();
            key = build.Reference(token.value);
        } else if (this.match(TOKEN_$)) {
            this.consume();
            key = build.Current();
        } else if (this.match(TOKEN_STRING) || this.match(TOKEN_NUMBER)) {
            const token = this.consume();
            key = build.Literal(token.value);
        } else if (this.match(TOKEN_LITERAL)) {
            // Handle literal property names: true, false, null, undefined, etc.
            const token = this.consume();
            key = build.Literal(token.value);
        } else if (this.match(TOKEN_OPEN_BRACKET)) {
            // Computed property name: [expression]
            this.consume(); // consume [
            key = this.parseExpression();
            this.consume(TOKEN_CLOSE_BRACKET); // consume ]
        } else {
            throw new Error('Expected object property name');
        }

        if (this.match(TOKEN_COLON)) {
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
