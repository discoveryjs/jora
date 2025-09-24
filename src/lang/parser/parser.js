import * as build from './nodes.js';
import { toNumberLiteral, toRegExpLiteral, toStringLiteral } from './convert-to-literal.js';
import { LITERALS } from './tokenizer.js';
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

// Spread type constants
const SPREAD_ARRAY = true;
const SPREAD_OBJECT = false;

// Operator precedence table (higher = higher precedence)
const RIGHT_ASSOCIATIVE = new Set([TOKEN_ARROW, TOKEN_QUESTION]);
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

export function parse(tokenizer) {
    let current = null;

    try {
        // Initialize by advancing to first token
        advance();

        return parseBlock();
    } finally {
        // Ensure nothing left after parsing
        advance(TOKEN_EOF);
    }

    function maybe(fn) {
        const tokenizerState = tokenizer.saveState();
        const currentToken = current;

        try {
            return fn();
        } catch (error) {
            tokenizer.restoreState(tokenizerState);
            current = currentToken;

            return null;
        }
    }

    // Helper to throw parsing errors with position tracking
    function throwError(message) {
        throw new Error(message); // TODO: Add position tracking later
    }

    function match(type) {
        return current.type === type;
    }

    function advance(expectedType) {
        if (expectedType !== undefined && current.type !== expectedType) {
            throwError(`Expected \`${tokenNames[expectedType]}\`, got \`${tokenNames[current.type]}\``);
        }

        const token = current;
        current = tokenizer.nextToken();
        return token;
    }

    function advanceIf(type) {
        return current.type === type
            ? advance()
            : null;
    }

    function consumeValue(expectedType) {
        const value = current.value;
        advance(expectedType);
        return value;
    }

    function getPrecedence(type) {
        return PRECEDENCE.get(type);
    }

    function isOperator(type) {
        return PRECEDENCE.has(type);
    }

    function isRightAssociative(type) {
        return RIGHT_ASSOCIATIVE.has(type);
    }

    function parseBlock() {
        return build.Block(
            parseDefinitions(),
            parseExpression() || build.Placeholder()
        );
    }

    function parseDefinitions() {
        const definitions = [];
        let definition;

        while (definition = maybe(parseDefinition)) {
            definitions.push(definition);
        }

        return definitions;
    }

    function parseDefinition() {
        const declarator = parseDeclarator();
        const value = advanceIf(TOKEN_COLON)
            ? parseExpression()
            : null;

        advance(TOKEN_SEMICOLON); // consume ';'

        return build.Definition(declarator, value);
    }

    function parseDeclarator() {
        const name = match(TOKEN_$IDENT)
            ? consumeValue().slice(1)
            : advanceIf(TOKEN_$)
                ? null
                : throwError('Expected declarator');

        return build.Declarator(name);
    }

    function parseIdentifier(refAsIdentifier = false) {
        return build.Identifier(
            refAsIdentifier
                ? consumeValue(TOKEN_$IDENT).slice(1)
                : consumeValue(TOKEN_IDENT)
        );
    }

    // Multi-build helper methods
    function parseIdentifierOrReference() {
        switch (current.type) {
            case TOKEN_IDENT:
            case TOKEN_LITERAL:
                return build.Identifier(consumeValue());

            case TOKEN_METHOD_OPEN:
                // Remove ( suffix only
                return build.Identifier(consumeValue().slice(0, -1));

            case TOKEN_$IDENT:
                // Remove $ prefix
                return build.Reference(parseIdentifier(true));

            case TOKEN_$METHOD_OPEN:
                // Remove $ prefix and ( suffix
                return build.Reference(build.Identifier(consumeValue().slice(1, -1)));

            default:
                throwError('Expected identifier or reference');
        }
    }

    function parseSpecialReference() {
        switch (current.type) {
            case TOKEN_AT:
                advance();
                return build.Data();

            case TOKEN_HASH:
                advance();
                return build.Context();

            case TOKEN_$:
                advance();
                return build.Current();

            case TOKEN_$$:
                advance();
                return build.Arg1();

            default:
                throwError('Expected special reference');
        }
    }

    function parseLiteralValue() {
        let value;

        switch (current.type) {
            case TOKEN_NUMBER:
                value = toNumberLiteral(consumeValue());
                break;

            case TOKEN_STRING:
                value = toStringLiteral(consumeValue(), false, 1);
                break;

            case TOKEN_TEMPLATE:
            case TOKEN_TPL_END:
                value = toStringLiteral(consumeValue(), true, 1);
                break;

            case TOKEN_TPL_START:
            case TOKEN_TPL_CONTINUE:
                value = toStringLiteral(consumeValue(), true, 2);
                break;

            case TOKEN_REGEXP:
                value = toRegExpLiteral(consumeValue());
                break;

            case TOKEN_LITERAL:
                value = LITERALS.get(consumeValue());
                break;

            default:
                throwError('Expected literal value');
        }

        return build.Literal(value);
    }

    function parseExpression(minPrec = 0) {
        let left = parseUnary();

        while (isOperator(current.type) &&
               getPrecedence(current.type) >= minPrec &&
               !match(TOKEN_EOF)) {
            const type = current.type;
            const prec = getPrecedence(type) + !isRightAssociative(type);

            switch (current.type) {
                case TOKEN_QUESTION:
                    left = parseTernaryConditional(left, prec);
                    break;

                case TOKEN_PIPE:
                    left = parsePipeline(left);
                    break;

                case TOKEN_IS:
                    left = parseAssertionPostfix(left);
                    break;

                case TOKEN_ORDER:
                    left = parseCompareFunction(left);
                    break;

                default:
                    left = parseBinaryOperator(left, prec);
            }
        }

        return left;
    }

    function parseUnary() {
        switch (current.type) {
            case TOKEN_NOT:
            case TOKEN_NO:
            case TOKEN_PLUS:
            case TOKEN_MINUS:
            case TOKEN_IS:
                return parseUnaryPrefix();

            case TOKEN_ARROW:
                return parseFunction();

            default:
                return parsePostfix();
        }
    }

    function parsePostfix() {
        let expr = parsePrimary();

        while (!match(TOKEN_EOF)) {
            switch (current.type) {
                case TOKEN_DOT:
                    advanceIf(TOKEN_DOT);

                    switch (current.type) {
                        case TOKEN_IDENT:
                            expr = parseGetProperty(expr);
                            break;
                        case TOKEN_METHOD_OPEN:
                        case TOKEN_$METHOD_OPEN:
                            expr = parseMethodCall(expr);
                            break;
                        default:
                            throwError('Expected property name or method call after dot');
                    }
                    break;

                case TOKEN_DOT_OPEN_PAREN:
                    expr = parseMap(expr);
                    break;

                case TOKEN_DOT_OPEN_BRACKET:
                    expr = parseFilter(expr);
                    break;

                case TOKEN_DOT_DOT_OPEN_PAREN:
                    expr = parseMapRecursive(expr);
                    break;

                case TOKEN_DOT_DOT:
                    advanceIf(TOKEN_DOT_DOT);

                    switch (current.type) {
                        case TOKEN_IDENT:
                            expr = parseMapRecursive(expr, parseGetProperty(null));
                            break;

                        case TOKEN_METHOD_OPEN:
                        case TOKEN_$METHOD_OPEN:
                            expr = parseMapRecursive(expr, parseMethodCall(null));
                            break;

                        default:
                            throwError('Expected property name or method call after ..');
                    }
                    break;

                case TOKEN_OPEN_BRACKET: {
                    expr = maybe(() => parseSliceNotation(expr)) || parseBracketAccess(expr);
                    break;
                }

                default:
                    return expr;
            }
        }

        return expr;
    }

    function parseAssertionPostfix(left) {
        advance(TOKEN_IS);

        return build.Postfix(left, parseAssertion());
    }

    function parseAssertion() {
        const negate = Boolean(advanceIf(TOKEN_NOT));

        // Handle parentheses
        if (advanceIf(TOKEN_OPEN_PAREN)) {
            const terms = [];

            while (!advanceIf(TOKEN_CLOSE_PAREN)) {
                terms.push(parseAssertion());

                if (match(TOKEN_AND) || match(TOKEN_OR)) {
                    terms.push(consumeValue());
                }
            }

            return build.Assertion(terms, negate);
        }

        // Handle method calls with arguments
        if (match(TOKEN_METHOD_OPEN) || match(TOKEN_$METHOD_OPEN)) {
            return build.Assertion(parseMethod(), negate);
        }

        // Handle assertion terms
        switch (current.type) {
            case TOKEN_IDENT:
            case TOKEN_LITERAL:
                return build.Assertion(parseIdentifierOrReference(), negate);

            case TOKEN_$IDENT:
                // In assertion context, $variable becomes Method with empty arguments
                // FIXME: Wrapping into Method looks as a bug, should be just Reference instead
                const reference = parseIdentifierOrReference();
                const method = build.Method(reference, []);

                return build.Assertion(method, negate);

            default:
                throwError('Expected assertion term');
        }
    }

    function parseGetProperty(expr = null) {
        return build.GetProperty(expr, parseIdentifier());
    }

    function parseMethod() {
        if (!match(TOKEN_METHOD_OPEN) && !match(TOKEN_$METHOD_OPEN)) {
            throwError('Expected token type for method call');
        }

        // Extract method name based on token type
        const methodRef = parseIdentifierOrReference();

        const args = [];
        if (!match(TOKEN_CLOSE_PAREN)) {
            do {
                args.push(parseExpression());
            } while (advanceIf(TOKEN_COMMA));
        }

        advance(TOKEN_CLOSE_PAREN);

        return build.Method(methodRef, args);
    }

    function parseMethodCall(value = null) {
        return build.MethodCall(value, parseMethod());
    }

    function parseTemplate() {
        const parts = [];

        if (match(TOKEN_TEMPLATE)) {
            parts.push(parseLiteralValue());
        } else {
            // Start with TPL_START token
            parts.push(parseLiteralValue(TOKEN_TPL_START));

            // Parse template expressions and continuations
            while (true) {
                // Parse the expression inside ${}
                parts.push(parseExpression());

                if (!match(TOKEN_TPL_CONTINUE)) {
                    break;
                }

                parts.push(parseLiteralValue(TOKEN_TPL_CONTINUE));
            }

            // End with TPL_END token
            parts.push(parseLiteralValue(TOKEN_TPL_END));
        }

        return build.Template(parts);
    }

    function parsePrimary() {
        switch (current.type) {
            case TOKEN_NUMBER:
            case TOKEN_STRING:
            case TOKEN_REGEXP:
            case TOKEN_LITERAL:
                return parseLiteralValue();

            case TOKEN_TEMPLATE:
            case TOKEN_TPL_START:
                return parseTemplate();

            case TOKEN_AT:
            case TOKEN_HASH:
            case TOKEN_$:
            case TOKEN_$$:
                return parseSpecialReference();

            case TOKEN_$IDENT:
                return maybe(parseFunction) || parseIdentifierOrReference();

            case TOKEN_IDENT:
                return parseGetProperty();

            case TOKEN_METHOD_OPEN:
            case TOKEN_$METHOD_OPEN:
                return parseMethodCall(null);

            case TOKEN_DOT:
                advance(TOKEN_DOT); // consume '.'

                switch (current.type) {
                    case TOKEN_IDENT:
                        return parseGetProperty(null);

                    case TOKEN_METHOD_OPEN:
                    case TOKEN_$METHOD_OPEN:
                        return parseMethodCall(null);

                    default:
                        throwError('Expected property name or method call after dot');
                }

            case TOKEN_DOT_OPEN_PAREN:
                return parseMap(null);

            case TOKEN_DOT_OPEN_BRACKET:
                return parseFilter(null);

            case TOKEN_DOT_DOT: {
                advanceIf(TOKEN_DOT_DOT); // consume '..'

                switch (current.type) {
                    case TOKEN_IDENT:
                        return parseMapRecursive(null, parseGetProperty(null));

                    case TOKEN_METHOD_OPEN:
                    case TOKEN_$METHOD_OPEN:
                        return parseMapRecursive(null, parseMethodCall(null));

                    default:
                        throwError('Expected property name after ..');
                }
            }

            case TOKEN_OPEN_BRACKET:
                return maybe(parseSliceNotation) || parseArray();

            case TOKEN_OPEN_BRACE:
                return parseObject();

            case TOKEN_OPEN_PAREN:
                return maybe(parseFunction) || parseParentheses();

            case TOKEN_PIPE:
                return parsePipeline(null);

            default:
                return null;
        }
    }

    function parseFunction() {
        const params = [];

        if (advanceIf(TOKEN_OPEN_PAREN)) {
            // Parse parameter list
            if (!match(TOKEN_CLOSE_PAREN)) {
                do {
                    params.push(parseIdentifier(true));
                } while (advanceIf(TOKEN_COMMA));
            }

            advance(TOKEN_CLOSE_PAREN);
        } else if (match(TOKEN_$IDENT)) {
            params.push(parseIdentifier(true));
        }

        advance(TOKEN_ARROW);

        return build.Function(params, parseExpression() || build.Placeholder());
    }

    function parseCompareFunction(expr) {
        const compares = [parseCompare(expr)];

        while (advanceIf(TOKEN_COMMA)) {
            // Parse the next expression with precedence higher than ORDER to avoid nested CompareFunction
            compares.push(
                parseCompare(parseExpression(getPrecedence(TOKEN_ORDER) + 1))
            );
        }

        return build.CompareFunction(compares);
    }

    function parseCompare(expr) {
        return build.Compare(expr, consumeValue(TOKEN_ORDER));
    }

    function parseParentheses() {
        advance(TOKEN_OPEN_PAREN);

        const definitions = parseDefinitions();
        const expression = parseExpression() || build.Placeholder();

        advance(TOKEN_CLOSE_PAREN);

        // If we have definitions, wrap in a Block, otherwise just return the expression
        return build.Parentheses(
            definitions.length > 0
                ? build.Block(definitions, expression)
                : expression
        );
    }

    function parseArray() {
        advance(TOKEN_OPEN_BRACKET);

        const elements = [];

        if (!advanceIf(TOKEN_CLOSE_BRACKET)) {
            do {
                if (match(TOKEN_COMMA)) {
                    throwError('Expected expression before comma in array literal');
                }

                elements.push(
                    match(TOKEN_DOT_DOT_DOT)
                        ? parseSpread(SPREAD_ARRAY)
                        : parseExpression()
                );
            } while (advanceIf(TOKEN_COMMA) && !match(TOKEN_CLOSE_BRACKET));

            advance(TOKEN_CLOSE_BRACKET);
        }

        return build.Array(elements);
    }

    function parseSliceNotation(expr = null) {
        advance(TOKEN_OPEN_BRACKET);

        const args = [parseExpression()];

        // Parse first argument (might be empty for [:end] notation)
        advance(TOKEN_COLON);
        args.push(parseExpression());

        if (advanceIf(TOKEN_COLON)) {
            args.push(parseExpression());
        }

        advance(TOKEN_CLOSE_BRACKET);

        return build.SliceNotation(expr, args);
    }

    function parseObject() {
        advance(TOKEN_OPEN_BRACE);

        // First, try to parse any definitions (like parseBlock does)
        const definitions = parseDefinitions();
        const entries = [];

        if (!match(TOKEN_CLOSE_BRACE)) {
            entries.push(parseObjectEntry());

            while (advanceIf(TOKEN_COMMA)) {
                if (!match(TOKEN_CLOSE_BRACE)) { // allow trailing comma
                    entries.push(parseObjectEntry());
                }
            }
        }

        advance(TOKEN_CLOSE_BRACE);

        // If we found definitions, wrap the object in a Block (like legacy parser does)
        if (definitions.length > 0) {
            return build.Block(definitions, build.Object(entries));
        }

        return build.Object(entries);
    }

    function parseObjectEntry() {
        // Handle spread syntax: ...expression
        if (match(TOKEN_DOT_DOT_DOT)) {
            return parseSpread(SPREAD_OBJECT);
        }

        let key;

        // Parse object key using existing methods
        switch (current.type) {
            case TOKEN_IDENT:
                key = parseIdentifierOrReference();
                break;

            case TOKEN_LITERAL:
                // Literal values (true, false, null, etc.) should be treated as literals in object keys
                key = parseLiteralValue();
                break;

            case TOKEN_$IDENT: {
                // $variables in object context depend on whether it's shorthand or explicit
                const tokenValue = consumeValue();

                if (match(TOKEN_COLON)) {
                    // Explicit property: treat as identifier with $ preserved
                    key = build.Identifier(tokenValue);
                } else {
                    // Shorthand property: treat as reference
                    key = build.Reference(build.Identifier(tokenValue.slice(1)));
                }
                break;
            }

            case TOKEN_$:
                key = parseSpecialReference();
                break;

            case TOKEN_STRING:
            case TOKEN_NUMBER:
            case TOKEN_REGEXP:
                key = parseLiteralValue();
                break;

            case TOKEN_OPEN_BRACKET:
                // Computed property name: [expression]
                advance();
                key = parseExpression();
                advance(TOKEN_CLOSE_BRACKET);
                break;

            default:
                throwError('Expected object property name');
        }

        return build.ObjectEntry(
            key,
            advanceIf(TOKEN_COLON) && parseExpression()
        );
    }

    function parseBracketAccess(expr) {
        advance(TOKEN_OPEN_BRACKET);
        const getter = parseExpression();
        advance(TOKEN_CLOSE_BRACKET);

        return build.Pick(expr, getter);
    }

    function parseMap(value) {
        advance(TOKEN_DOT_OPEN_PAREN);
        const query = parseBlock();
        advance(TOKEN_CLOSE_PAREN);

        return build.Map(value, query);
    }

    function parseMapRecursive(value, property = null) {
        if (property) {
            return build.MapRecursive(value, property);
        }

        advance(TOKEN_DOT_DOT_OPEN_PAREN);
        const query = parseBlock();
        advance(TOKEN_CLOSE_PAREN);

        return build.MapRecursive(value, query);
    }

    function parseFilter(value) {
        advance(TOKEN_DOT_OPEN_BRACKET);
        const query = parseBlock();
        advance(TOKEN_CLOSE_BRACKET);

        return build.Filter(value, query);
    }

    function parseSpread(isArray) {
        advance(TOKEN_DOT_DOT_DOT);

        return build.Spread(parseExpression(), isArray);
    }

    function parsePipeline(left) {
        advance(TOKEN_PIPE);

        // Parse right side: definitions + expression with proper precedence
        const definitions = parseDefinitions();
        const body = parseExpression(getPrecedence(TOKEN_PIPE) + 1) || build.Placeholder();

        // If we have definitions, wrap in a Block like parseBlock does
        const right = definitions.length > 0
            ? build.Block(definitions, body)
            : body;

        return build.Pipeline(left, right);
    }

    function parseTernaryConditional(condition, prec) {
        advance(TOKEN_QUESTION);

        const consequent = parseExpression(prec) || build.Placeholder();
        const alternate = advanceIf(TOKEN_COLON)
            // Colon is present, parse alternate or use Placeholder if missing
            ? parseExpression(prec) || build.Placeholder()
            // No colon, use null for alternate
            : null;

        return build.Conditional(condition, consequent, alternate);
    }

    function parseBinaryOperator(left, prec) {
        const operator = consumeValue();
        const right = parseExpression(prec);

        if (!right) {
            throwError('Expected expression after operator');
        }

        return build.Binary(operator, left, right);
    }

    function parseUnaryPrefix() {
        const prec = getPrecedence(current.type);
        const operator = consumeValue();

        return build.Prefix(
            operator,
            operator === 'is'
                ? parseAssertion()
                : parseExpression(prec + 1)  // Parse with higher precedence to avoid self-binding
        );
    }
}
