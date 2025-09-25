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

export function parse(tokens) {
    let index = 0;
    let current = tokens[index];

    try {
        return parseBlock();
    } finally {
        // Ensure nothing left after parsing
        advance(TOKEN_EOF);
    }

    function maybe(fn) {
        const savedIndex = index;

        try {
            return fn();
        } catch (error) {
            index = savedIndex;
            current = tokens[index];
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

    function nextMatch(type) {
        const nextTokenType = index < tokens.length - 1
            ? tokens[index + 1].type
            : TOKEN_EOF;
        return nextTokenType === type;
    }

    function advance(expectedType) {
        if (expectedType !== undefined && current.type !== expectedType) {
            throwError(`Expected \`${tokenNames[expectedType]}\`, got \`${tokenNames[current.type]}\``);
        }

        const token = current;

        // Stay on EOF if at end
        if (index < tokens.length - 1) {
            index++;
            current = tokens[index];
        }

        return token;
    }

    function advanceIf(type) {
        return current.type === type
            ? advance()
            : null;
    }

    function getValueAndAdvance(expectedType) {
        const value = current.value;
        advance(expectedType);
        return value;
    }

    function consumeSurrounded(typeOpen, fn, typeClose) {
        advance(typeOpen);
        const value = fn();
        advance(typeClose);
        return value;
    }

    // Range tracking helpers
    function startRange() {
        return current.start;
    }

    function endRange(start) {
        // Use the previous token's end, because we iterate over meaningful tokens,
        // i.e. skipping whitespace and comment tokens.
        // There may be skipped tokens between meaningful ones, so we need to end the range
        // at the previous token's end, excluding the skipped whitespace/comment tokens.
        return [start, index > 0 ? tokens[index - 1].end : 0];
    }

    function getRangeAndAdvance(expectedType) {
        const range = [current.start, current.end];
        advance(expectedType);
        return range;
    }

    // AST node creators called from several places
    // Delete once only one callsite remains
    function createPlaceholder() {
        return build.Placeholder([current.start, current.start]);
    }

    function createBlock(definitions, body, range) {
        return build.Block(definitions, body, range);
    }

    function createMethod(reference, args, range) {
        return build.Method(reference, args, range);
    }

    // Precedence helpers
    // TODO: Remove
    function getPrecedence(type) {
        return PRECEDENCE.get(type);
    }

    function isOperator(type) {
        return PRECEDENCE.has(type);
    }

    function isRightAssociative(type) {
        return RIGHT_ASSOCIATIVE.has(type);
    }

    // Parser methods
    function parseBlock() {
        const start = startRange();
        const definitions = parseDefinitions();
        const body = parseExpression() || createPlaceholder();

        return createBlock(
            definitions,
            body,
            endRange(start)
        );
    }

    function parseDefinitions() {
        const definitions = [];

        for (let definition; definition = maybe(parseDefinition);) {
            definitions.push(definition);
        }

        return definitions;
    }

    function parseDefinition() {
        const start = startRange();
        const declarator = parseDeclarator();
        const value = advanceIf(TOKEN_COLON)
            ? parseExpression()
            : null;

        advance(TOKEN_SEMICOLON);

        return build.Definition(declarator, value, endRange(start));
    }

    function parseDeclarator() {
        const start = startRange();
        const name = match(TOKEN_$IDENT)
            ? getValueAndAdvance().slice(1)
            : advanceIf(TOKEN_$)
                ? null
                : throwError('Expected declarator');

        return build.Declarator(name, endRange(start));
    }

    function parseIdentifier(preserveDollar = false) {
        const { start, end, type } = current;
        let name = getValueAndAdvance();
        let suffix = 0;

        if (!preserveDollar) {
            // Remove $ prefix
            if (type === TOKEN_$IDENT || type === TOKEN_$METHOD_OPEN) {
                name = name.slice(1);
            }
        }

        // Remove "(" suffix and adjust range to exclude the parenthesis
        if (type === TOKEN_METHOD_OPEN || type === TOKEN_$METHOD_OPEN) {
            name = name.slice(0, -1);
            suffix = 1;
        }

        return build.Identifier(name, [start, end - suffix]);
    }

    function parseReference() {
        const identifier = parseIdentifier();

        // TOKEN_$IDENT
        // TOKEN_$METHOD_OPEN
        return build.Reference(identifier, identifier.range.slice());
    }

    function parseSpecialReference() {
        switch (current.type) {
            case TOKEN_AT:
                return build.Data(getRangeAndAdvance());

            case TOKEN_HASH:
                return build.Context(getRangeAndAdvance());

            case TOKEN_$:
                return build.Current(getRangeAndAdvance());

            case TOKEN_$$:
                return build.Arg1(getRangeAndAdvance());

            default:
                throwError('Expected special reference');
        }
    }

    function parseLiteralValue() {
        const start = startRange();
        let value;

        switch (current.type) {
            case TOKEN_NUMBER:
                value = toNumberLiteral(getValueAndAdvance());
                break;

            case TOKEN_STRING:
                value = toStringLiteral(getValueAndAdvance(), false, 1);
                break;

            case TOKEN_TEMPLATE:
            case TOKEN_TPL_END:
                value = toStringLiteral(getValueAndAdvance(), true, 1);
                break;

            case TOKEN_TPL_START:
            case TOKEN_TPL_CONTINUE:
                value = toStringLiteral(getValueAndAdvance(), true, 2);
                break;

            case TOKEN_REGEXP:
                value = toRegExpLiteral(getValueAndAdvance());
                break;

            case TOKEN_LITERAL:
                value = LITERALS.get(getValueAndAdvance());
                break;

            default:
                throwError('Expected literal value');
        }

        return build.Literal(value, endRange(start));
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

            default:
                return parsePostfix();
        }
    }

    function parseUnaryPrefix() {
        const start = startRange();
        const prec = getPrecedence(current.type);
        const operator = getValueAndAdvance();

        const argument = operator === 'is'
            ? parseAssertion()
            : parseExpression(prec + 1);  // Parse with higher precedence to avoid self-binding

        return build.Prefix(
            operator,
            argument,
            endRange(start)
        );
    }

    function parsePostfix() {
        let expr = parsePrimary();

        while (!match(TOKEN_EOF)) {
            const start = startRange();

            switch (current.type) {
                case TOKEN_IS:
                    expr = parseAssertionPostfix(expr);
                    break;

                case TOKEN_DOT:
                    advanceIf(TOKEN_DOT);

                    switch (current.type) {
                        case TOKEN_IDENT:
                            expr = parseGetProperty(expr, start);
                            break;

                        case TOKEN_METHOD_OPEN:
                        case TOKEN_$METHOD_OPEN:
                            expr = parseMethodCall(expr, start);
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

                case TOKEN_DOT_DOT:
                    advance(TOKEN_DOT_DOT);

                    switch (current.type) {
                        case TOKEN_IDENT:
                            expr = parseMapRecursive(expr, parseGetProperty(null, start), start);
                            break;

                        case TOKEN_METHOD_OPEN:
                        case TOKEN_$METHOD_OPEN:
                            expr = parseMapRecursive(expr, parseMethodCall(null), start);
                            break;

                        default:
                            throwError('Expected property name or method call after ..');
                    }
                    break;

                case TOKEN_DOT_DOT_OPEN_PAREN:
                    expr = parseMapRecursive(expr);
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
                return maybe(parseFunction) || parseReference();

            case TOKEN_IDENT:
                return parseGetProperty(null);

            case TOKEN_METHOD_OPEN:
            case TOKEN_$METHOD_OPEN:
                return parseMethodCall(null);

            case TOKEN_OPEN_BRACKET:
                return maybe(parseSliceNotation) || parseArray();

            case TOKEN_OPEN_BRACE:
                return parseObject();

            case TOKEN_OPEN_PAREN:
                return maybe(parseFunction) || parseParentheses();

            case TOKEN_ARROW:
                return parseFunction();

            default:
                return null;
        }
    }

    function parseAssertionPostfix(left) {
        const start = left?.range[0] ?? startRange(); // FIXME: ???

        advance(TOKEN_IS);

        return build.Postfix(left, parseAssertion(), endRange(start));
    }

    function parseAssertion() {
        const start = startRange();
        const negate = advanceIf(TOKEN_NOT) !== null;
        let expr = [];

        // Handle assertion terms
        switch (current.type) {
            case TOKEN_OPEN_PAREN:
                advance();

                while (!advanceIf(TOKEN_CLOSE_PAREN)) {
                    expr.push(parseAssertion());

                    if (match(TOKEN_AND) || match(TOKEN_OR)) {
                        expr.push(getValueAndAdvance());
                    }
                }

                break;

            case TOKEN_IDENT:
            case TOKEN_LITERAL:
                expr = parseIdentifier();
                break;

            case TOKEN_$IDENT:
                // In assertion context, $variable becomes Method with empty arguments
                // FIXME: Wrapping into Method looks as a bug, should be just Reference instead
                expr = createMethod(parseReference(), [], endRange(start));
                break;

            default:
                throwError('Expected assertion term');
        }

        return build.Assertion(expr, negate, endRange(start));
    }

    function parseGetProperty(expr = null, start = startRange()) {
        start = expr?.range[0] ?? start; // FIXME: ???
        // console.log('start parseGetProperty', start, current.start, expr?.range[0], expr);
        // console.log(Error().stack);
        const property = parseIdentifier();

        return build.GetProperty(expr, property, endRange(start));
    }

    function parseMethod() {
        const start = startRange();
        const methodRef = match(TOKEN_METHOD_OPEN)
            ? parseIdentifier()
            : match(TOKEN_$METHOD_OPEN)
                ? parseReference()
                : throwError('Expected token type for method call');

        const args = [];
        if (!match(TOKEN_CLOSE_PAREN)) {
            do {
                args.push(parseExpression());
            } while (advanceIf(TOKEN_COMMA));
        }

        advance(TOKEN_CLOSE_PAREN);

        return createMethod(methodRef, args, endRange(start));
    }

    function parseMethodCall(value = null, start = startRange()) {
        start = value?.range[0] ?? start;
        const method = parseMethod();

        return build.MethodCall(value, method, endRange(start));
    }

    function parseTemplate() {
        const start = startRange();
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

        return build.Template(parts, endRange(start));
    }

    function parseFunction() {
        const start = startRange();
        const params = [];

        if (advanceIf(TOKEN_OPEN_PAREN)) {
            // Parse parameter list
            if (!match(TOKEN_CLOSE_PAREN)) {
                do {
                    params.push(parseIdentifier());
                } while (advanceIf(TOKEN_COMMA));
            }

            advance(TOKEN_CLOSE_PAREN);
        } else if (match(TOKEN_$IDENT)) {
            params.push(parseIdentifier());
        }

        advance(TOKEN_ARROW);

        const body = parseExpression() || createPlaceholder();
        return build.Function(params, body, endRange(start));
    }

    function parseCompareFunction(expr) {
        const start = expr?.range[0] ?? startRange();
        const compares = [parseCompare(expr)];

        while (advanceIf(TOKEN_COMMA)) {
            // Parse the next expression with precedence higher than ORDER to avoid nested CompareFunction
            compares.push(
                parseCompare(parseExpression(getPrecedence(TOKEN_ORDER) + 1))
            );
        }

        return build.CompareFunction(compares, endRange(start));
    }

    function parseCompare(expr) {
        const start = expr?.range[0] ?? startRange();
        const order = getValueAndAdvance(TOKEN_ORDER);

        return build.Compare(expr, order, endRange(start));
    }

    function parseParentheses() {
        const start = startRange();
        advance(TOKEN_OPEN_PAREN);

        const definitions = parseDefinitions();
        const expression = parseExpression() || createPlaceholder();

        advance(TOKEN_CLOSE_PAREN);

        // If we have definitions, wrap in a Block, otherwise just return the expression
        return build.Parentheses(
            definitions.length > 0
                ? createBlock(definitions, expression, endRange(start))
                : expression,
            endRange(start)
        );
    }

    function parseArray() {
        const start = startRange();
        const elements = [];

        advance(TOKEN_OPEN_BRACKET);

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

        return build.Array(elements, endRange(start));
    }

    function parseSliceNotation(expr = null) {
        const start = expr?.range[0] ?? startRange();
        const args = [
            consumeSurrounded(
                TOKEN_OPEN_BRACKET,
                parseExpression,
                TOKEN_COLON
            ),
            parseExpression()
        ];

        // Optional third argument, already consumed "[ e : e"
        if (advanceIf(TOKEN_COLON)) {
            args.push(parseExpression());
        }

        advance(TOKEN_CLOSE_BRACKET);

        return build.SliceNotation(expr, args, endRange(start));
    }

    function parseObject() {
        const start = startRange();

        advance(TOKEN_OPEN_BRACE);

        // First, try to parse any definitions (like parseBlock does)
        const definitions = parseDefinitions();
        const entries = [];

        if (!match(TOKEN_CLOSE_BRACE)) {
            // allow trailing comma
            do {
                entries.push(
                    match(TOKEN_DOT_DOT_DOT)
                        ? parseSpread(SPREAD_OBJECT)
                        : parseObjectEntry()
                );
            } while (advanceIf(TOKEN_COMMA) && !match(TOKEN_CLOSE_BRACE));
        }

        advance(TOKEN_CLOSE_BRACE);

        const object = build.Object(entries, endRange(start));

        // If we found definitions, wrap the object in a Block (like legacy parser does)
        // FIXME: This behavior is questionable, block wrapper should be removed
        return definitions.length > 0
            ? createBlock(definitions, object, endRange(start))
            : object;
    }

    function parseObjectEntry() {
        const start = startRange();
        let key;

        // Parse object key using existing methods
        switch (current.type) {
            case TOKEN_IDENT:
                key = parseIdentifier();
                break;

            case TOKEN_LITERAL:
            case TOKEN_STRING:
            case TOKEN_NUMBER:
                key = parseLiteralValue();
                break;

            case TOKEN_$:
                key = parseSpecialReference();
                break;

            case TOKEN_$IDENT:
                // $variables in object context depend on whether it's shorthand or explicit
                key = nextMatch(TOKEN_COLON)
                    // Explicit property: treat as identifier with $ preserved, e.g. {$foo: 1}
                    ? parseIdentifier(true)
                    // Shorthand property: treat as reference, e.g. {$foo} becomes {foo: $foo}
                    : parseReference();
                break;

            case TOKEN_OPEN_BRACKET: // Computed property name: [expression]
                key = consumeSurrounded(
                    TOKEN_OPEN_BRACKET,
                    parseExpression,
                    TOKEN_CLOSE_BRACKET
                );
                break;

            default:
                throwError('Expected object property name');
        }

        const value = advanceIf(TOKEN_COLON) && parseExpression();

        return build.ObjectEntry(
            key,
            value,
            endRange(start)
        );
    }

    function parseSpread(isArray) {
        const start = startRange();
        const expression = advance(TOKEN_DOT_DOT_DOT) && parseExpression();

        return build.Spread(expression, isArray, endRange(start));
    }


    function parseBracketAccess(expr) {
        const start = expr?.range[0] ?? startRange();
        const getter = consumeSurrounded(
            TOKEN_OPEN_BRACKET,
            parseExpression,
            TOKEN_CLOSE_BRACKET
        );

        return build.Pick(expr, getter, endRange(start));
    }

    function parseMap(value) {
        const start = value?.range[0] ?? startRange();
        const query = consumeSurrounded(
            TOKEN_DOT_OPEN_PAREN,
            parseBlock,
            TOKEN_CLOSE_PAREN
        );

        return build.Map(value, query, endRange(start));
    }

    function parseMapRecursive(value, property = null, start = startRange()) {
        start = value?.range[0] ?? start;

        const query = property || consumeSurrounded(
            TOKEN_DOT_DOT_OPEN_PAREN,
            parseBlock,
            TOKEN_CLOSE_PAREN
        );

        return build.MapRecursive(value, query, endRange(start));
    }

    function parseFilter(value) {
        const start = value?.range[0] ?? startRange();
        const query = consumeSurrounded(
            TOKEN_DOT_OPEN_BRACKET,
            parseBlock,
            TOKEN_CLOSE_BRACKET
        );

        return build.Filter(value, query, endRange(start));
    }

    function parsePipeline(left) {
        const start = left?.range[0] ?? startRange();

        advance(TOKEN_PIPE);

        // Parse right side: definitions + expression with proper precedence
        const definitions = parseDefinitions();
        const body = parseExpression(getPrecedence(TOKEN_PIPE) + 1) || createPlaceholder();

        // If we have definitions, wrap in a Block like parseBlock does
        // FIXME: This behavior is questionable, block wrapper should be removed
        const right = definitions.length > 0
            ? createBlock(definitions, body, endRange(start))
            : body;

        return build.Pipeline(left, right, endRange(start));
    }

    function parseTernaryConditional(condition, prec) {
        const start = condition?.range[0] ?? startRange();

        advance(TOKEN_QUESTION);

        const consequent = parseExpression(prec) || createPlaceholder();
        const alternate = advanceIf(TOKEN_COLON)
            // Colon is present, parse alternate or use Placeholder if missing
            ? parseExpression(prec) || createPlaceholder()
            // No colon, use null for alternate
            : null;

        return build.Conditional(condition, consequent, alternate, endRange(start));
    }

    function parseBinaryOperator(left, prec) {
        const start = left.range[0] ?? startRange();
        const operator = getValueAndAdvance();
        const right = parseExpression(prec) || throwError('Expected expression');

        return build.Binary(operator, left, right, endRange(start));
    }
}
