import { toNumberLiteral, toRegExpLiteral, toStringLiteral } from './convert-to-literal.js';
import { offsetToLoc, showPosition } from './error.js';
import { LITERALS, tokenize } from './tokenizer.js';
import {
    TOKEN_NUMBER, TOKEN_STRING, TOKEN_REGEXP, TOKEN_LITERAL, TOKEN_IDENT, TOKEN_$IDENT,
    TOKEN_AT, TOKEN_HASH, TOKEN_$, TOKEN_$$, TOKEN_AND, TOKEN_OR, TOKEN_NOT, TOKEN_NO,
    TOKEN_IS, TOKEN_IN, TOKEN_NOTIN, TOKEN_HAS, TOKEN_HASNO, TOKEN_ORDER, TOKEN_METHOD_OPEN,
    TOKEN_$METHOD_OPEN, TOKEN_TEMPLATE, TOKEN_TPL_START, TOKEN_TPL_CONTINUE, TOKEN_TPL_END,
    TOKEN_DOT, TOKEN_DOT_DOT, TOKEN_DOT_DOT_DOT, TOKEN_DOT_OPEN_PAREN, TOKEN_DOT_OPEN_BRACKET,
    TOKEN_DOT_DOT_OPEN_PAREN, TOKEN_PIPE, TOKEN_ARROW, TOKEN_EQUALS, TOKEN_NOT_EQUALS,
    TOKEN_MATCH, TOKEN_LESS_THAN, TOKEN_LESS_THAN_EQUALS, TOKEN_GREATER_THAN,
    TOKEN_GREATER_THAN_EQUALS, TOKEN_PLUS, TOKEN_MINUS, TOKEN_MULTIPLY, TOKEN_DIVIDE,
    TOKEN_MODULO, TOKEN_NULLISH_COALESCING, TOKEN_QUESTION, TOKEN_OPEN_PAREN, TOKEN_CLOSE_PAREN,
    TOKEN_OPEN_BRACKET, TOKEN_CLOSE_BRACKET, TOKEN_OPEN_BRACE, TOKEN_CLOSE_BRACE, TOKEN_COMMA,
    TOKEN_COLON, TOKEN_SEMICOLON, TOKEN_EOF, TOKEN_BAD,
    tokenNames, createTokenTable, createTokenSet
} from './tokens.js';

const RECOVERABLE_ERROR = Symbol('RECOVERABLE_ERROR');
const TOKEN_ANY = -1;
const SPREAD_ARRAY = true;
const SPREAD_OBJECT = false;

// --- Operator precedence ---------------------------------------------------
// Numeric precedence values (higher number = binds tighter). Non-operator
// tokens implicitly have precedence -1 (see createTokenTable implementation),
// allowing a single numeric comparison to both detect an operator and decide
// whether it should bind at the current recursion depth (precedence climbing).
const RIGHT_ASSOCIATIVE = createTokenSet(TOKEN_QUESTION);
const PRECEDENCE = createTokenTable(
    TOKEN_ORDER, 1,  // ORDER has lower precedence than PIPE
    TOKEN_PIPE, 2,   // So pipeline binds tighter: `foo | bar desc` === `(foo | bar) desc`
    TOKEN_QUESTION, 3,
    TOKEN_IS, 4,
    TOKEN_OR, 5,
    TOKEN_AND, 6,
    TOKEN_NULLISH_COALESCING, 7,
    TOKEN_NOT, 8,
    TOKEN_NO, 8,
    TOKEN_IN, 9,
    TOKEN_NOTIN, 9,
    TOKEN_HAS, 9,
    TOKEN_HASNO, 9,
    TOKEN_EQUALS, 10,
    TOKEN_NOT_EQUALS, 10,
    TOKEN_MATCH, 10,
    TOKEN_LESS_THAN, 11,
    TOKEN_LESS_THAN_EQUALS, 11,
    TOKEN_GREATER_THAN, 11,
    TOKEN_GREATER_THAN_EQUALS, 11,
    TOKEN_PLUS, 12,
    TOKEN_MINUS, 12,
    TOKEN_MULTIPLY, 12,
    TOKEN_DIVIDE, 12,
    TOKEN_MODULO, 12
);

// ----------------------------------------------------------------------------
// Hand‑written recursive descent + precedence climbing parser that consumes a
// token stream produced by the tokenizer. Whitespace and comments are
// currently skipped at tokenization time; range tracking therefore relies on
// previous meaningful token's end (see endRange()).
// FIXME: This is a parity-oriented implementation mirroring legacy quirks
// (notably some range spans and Block wrappers) before subsequent cleanups.
export function parse(input, options) {
    const tokens = [...tokenize(input, options)];
    let index = 0;
    let current = tokens[index];
    let recoverable = false;
    let result = null;

    try {
        return result = parseBlock();
    } finally {
        // Ensure nothing left after parsing
        if (result) {
            advance(TOKEN_EOF);
        }
    }

    // ---- Error helpers ------------------------------------------------------
    function throwError(rawMessage, details) {
        if (recoverable) {
            // console.log(current, Error().stack+'');
            throw RECOVERABLE_ERROR;
        }

        let start = current.start;
        let end = current.end;
        details ??= {};

        if (Array.isArray(details?.inside)) {
            start += details.inside[0];
            end = start + details.inside[1];
        }

        // FIXME: To match legacy error reporting
        if (current.type === TOKEN_BAD) {
            rawMessage = `Bad input on line ${offsetToLoc(input, start).line} column ${offsetToLoc(input, start).column}`;
        }

        const startLoc = offsetToLoc(input, start);
        const message = current.type === TOKEN_BAD || details?.inside
            ? [ // FIXME: To match legacy error reporting
                rawMessage,
                '',
                showPosition(input, start)
            ]
            : [
                `Parse error on line ${startLoc.line}:`,
                '',
                showPosition(input, start),
                '',
                rawMessage
            ];

        const expected = !Array.isArray(details?.expected) ? null : [...new Set([].concat(
            ...details.expected
        ))];

        if (expected) {
            message.push(
                '',
                'Expecting ' + expected.join(', ') + ' got ' + tokenNames(current.type)
            );
        }

        throw Object.assign(new SyntaxError(message.join('\n')), {
            details: {
                rawMessage,
                text: current.value,
                token: current.name,
                expected,
                loc: {
                    range: [start, end],
                    start: startLoc,
                    end: offsetToLoc(input, end)
                }
            }
        });
    }

    function throwExpected(...tokens) {
        throwError(`Expecting ${tokens.map(t => `'${tokenNames[t]}'`).join(', ')}, got \`${tokenNames[current.type]}\``);
    }

    function throwInNoMatch(expectedType = TOKEN_ANY) {
        if (expectedType !== TOKEN_ANY && current.type !== expectedType) {
            throwError(`Expected \`${tokenNames[expectedType]}\`, got \`${tokenNames[current.type]}\``);
        }
    }

    function disableRecovery(fn) {
        const savedRecoverable = recoverable;

        recoverable = false;
        const result = fn();
        recoverable = savedRecoverable;
        return result;
    }

    function maybe(fn, ...args) {
        const savedRecoverable = recoverable;
        const savedIndex = index;

        try {
            recoverable = true;
            return fn(...args);
        } catch (error) {
            if (error !== RECOVERABLE_ERROR) {
                throw error;
            }

            index = savedIndex;
            current = tokens[index];

            return null;
        } finally {
            recoverable = savedRecoverable;
        }
    }

    // ---- Token consumption helpers -----------------------------------------
    function advance(expectedType) {
        const token = current;

        // assert expected type
        throwInNoMatch(expectedType);

        // Stay on EOF if at end
        index = Math.min(index + 1, tokens.length - 1);
        current = tokens[index];

        return token;
    }

    function advanceIfMatch(type) {
        return match(type)
            ? advance()
            : null;
    }

    function getValueAndAdvance(expectedType) {
        const value = current.value;
        advance(expectedType);
        return value;
    }

    function getRangeAndAdvance(expectedType) {
        const range = [current.start, current.end];
        advance(expectedType);
        return range;
    }

    function consumeSurrounded(typeOpen, fn, typeClose) {
        advance(typeOpen);
        const value = fn();
        advance(typeClose);
        return value;
    }

    // ---- Lookahead helpers --------------------------------------------------
    function match(type) {
        return current.type === type;
    }

    function nextMatch(type) {
        const nextTokenType = index < tokens.length - 1
            ? tokens[index + 1].type
            : TOKEN_EOF;
        return nextTokenType === type;
    }

    // ---- Range tracking -----------------------------------------------------
    function startRange() {
        return current.start;
    }

    function endRange(start) {
        // Use the previous token's end, because we iterate over meaningful tokens,
        // i.e. skipping whitespace and comment tokens.
        // There may be skipped tokens between meaningful ones, so we need to end the range
        // at the previous token's end, excluding the skipped whitespace/comment tokens.
        //
        // FIXME: Tokenizer should emit all the tokens, including whitespaces and comments,
        // this will allow to avoid hacks with previous token's end
        const end = index > 0 ? tokens[index - 1].end : 0;

        // When no tokens were consumed within a construct (empty block/expression),
        // start may exceed end due to whitespace skipping. Collapse to [end, end].
        if (start > end) {
            return [end, end];
        }

        return [start, end];
    }

    // Legacy quirk: postfix constructs (property access, map, filter, etc.) inherit
    // the left expression's start for their own range. This inflates node ranges.
    // Retained strictly for parity; will be removed once range normalization lands.
    //
    // FIXME: Postfix nodes should own only their syntactic span.
    function legacyPrefixStartRange(node) {
        return node?.range[0] ?? startRange();
    }

    // Minimal helpers for small repeated constructions. These remain until
    // structural changes eliminate their few remaining multi-call sites.
    function createPlaceholder() {
        // Use the end of the last consumed token as the placeholder position.
        // When no tokens have been consumed (index=0), use 0.
        const pos = index > 0 ? tokens[index - 1].end : 0;

        return {
            type: 'Placeholder',
            range: [pos, pos]
        };
    }

    function createBlock(definitions, body, range) {
        return {
            type: 'Block',
            definitions,
            body,
            range
        };
    }

    function createMethod(reference, args, range) {
        return {
            type: 'Method',
            reference,
            arguments: args,
            range
        };
    }

    // ============================= PARSER ====================================
    // Grammar (simplified / informal):
    //   Query          -> Block
    //   Block          -> Definition* Expression? (wrapped in Block node)
    //   Definition     -> Declarator (':' Expression)? ';'
    //   Expression     -> precedence climbing over binary / pipeline / order / ternary
    //   Primary        -> literals | references | special refs | arrays | objects | fn | templates | parentheses
    //   Postfix chain  -> property / method / map / mapRecursive / filter / slice / bracket access (left associative)
    //   Assertion      -> ( 'not'? ( IDENT | LITERAL | '(' Assertion (('and'|'or') Assertion )* ')' | $ident-as-empty-call ) )
    // The parser intentionally preserves certain legacy AST shapes (e.g., Block
    // wrappers inside Parentheses / Pipeline when definitions precede an expr).
    // TODO: Remove those wrappers after downstream tooling migrates.
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
        const value = advanceIfMatch(TOKEN_COLON)
            ? disableRecovery(parseExpression)
            : null;

        advance(TOKEN_SEMICOLON);

        return {
            type: 'Definition',
            declarator,
            value,
            range: endRange(start)
        };
    }

    function parseDeclarator() {
        const start = startRange();
        const name = match(TOKEN_$IDENT)
            ? getValueAndAdvance().slice(1)
            : advanceIfMatch(TOKEN_$)
                ? null
                : throwExpected(TOKEN_$IDENT, TOKEN_$);

        return {
            type: 'Declarator',
            name,
            range: endRange(start)
        };
    }

    function parseIdentifier(preserveDollar = false) {
        const { start, end, type, value } = current;
        let name = getValueAndAdvance();

        if (!preserveDollar) {
            // Remove $ prefix
            if (type === TOKEN_$IDENT || type === TOKEN_$METHOD_OPEN) {
                name = name.slice(1);
            }
        }

        // Remove "(" suffix and adjust range to exclude the parenthesis
        if (type === TOKEN_METHOD_OPEN || type === TOKEN_$METHOD_OPEN) {
            name = name.slice(0, -1);
        }

        return {
            type: 'Identifier',
            name,
            range: [start, end - !value.endsWith(name)]
        };
    }

    function parseReference() {
        const name = parseIdentifier();

        return {
            type: 'Reference',
            name,
            range: name.range.slice()
        };
    }

    function parseSpecialReference() {
        switch (current.type) {
            case TOKEN_AT:
                return {
                    type: 'Data',
                    range: getRangeAndAdvance()
                };

            case TOKEN_HASH:
                return {
                    type: 'Context',
                    range: getRangeAndAdvance()
                };

            case TOKEN_$:
                return {
                    type: 'Current',
                    range: getRangeAndAdvance()
                };

            case TOKEN_$$:
                return {
                    type: 'Arg1',
                    range: getRangeAndAdvance()
                };

            default:
                throwExpected(TOKEN_AT, TOKEN_HASH, TOKEN_$, TOKEN_$$);
        }
    }

    // FIXME: Should not convert to literals on parse, but this is needed for parity with legacy parser
    function parseLiteralValue() {
        const start = startRange();
        let value;

        switch (current.type) {
            case TOKEN_NUMBER:
                value = toNumberLiteral(current.value, throwError);
                break;

            case TOKEN_STRING:
                value = toStringLiteral(current.value, false, 1, throwError);
                break;

            case TOKEN_TEMPLATE:
            case TOKEN_TPL_END:
                value = toStringLiteral(current.value, true, 1, throwError);
                break;

            case TOKEN_TPL_START:
            case TOKEN_TPL_CONTINUE:
                value = toStringLiteral(current.value, true, 2, throwError);
                break;

            case TOKEN_REGEXP:
                value = toRegExpLiteral(current.value, throwError);
                break;

            case TOKEN_LITERAL:
                value = LITERALS.get(current.value);
                break;

            default:
                throwExpected(
                    TOKEN_NUMBER, TOKEN_STRING, TOKEN_REGEXP, TOKEN_LITERAL,
                    TOKEN_TEMPLATE, TOKEN_TPL_START, TOKEN_TPL_CONTINUE, TOKEN_TPL_END
                );
        }

        advance();

        return {
            type: 'Literal',
            value,
            range: endRange(start)
        };
    }

    function parseExpression(minPrec = 0) {
        let left = parseUnary();

        // Precedence climbing loop. For non-operators PRECEDENCE[...] is -1, so the
        // condition fails quickly without extra operator-type checks.
        while (PRECEDENCE[current.type] >= minPrec && !match(TOKEN_EOF)) {
            // Associativity tweak: left-associative ops parse RHS with (prec + 1)
            // so same-precedence operators group left; right-associative (currently '?')
            // reuse the same precedence value for right grouping.
            const prec = PRECEDENCE[current.type] + !RIGHT_ASSOCIATIVE[current.type];

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
        const prec = PRECEDENCE[current.type];
        const operator = getValueAndAdvance();

        const argument = operator === 'is'
            ? parseAssertion()            // 'is <assertion>' is syntactically distinct
            : parseExpression(prec + 1);  // Avoid self-binding by raising minimal precedence

        return {
            type: 'Prefix',
            operator,
            argument,
            range: endRange(start)
        };
    }

    function parsePostfix() {
        let expr = parsePrimary();
        // Postfix chain: consume as long as the next token starts a postfix form.
        while (!match(TOKEN_EOF)) {
            switch (current.type) {
                case TOKEN_IS:
                    expr = parseAssertionPostfix(expr);
                    break;

                case TOKEN_DOT:
                    expr = nextMatch(TOKEN_IDENT)
                        ? parseGetProperty(expr, true)
                        : nextMatch(TOKEN_METHOD_OPEN) || nextMatch(TOKEN_$METHOD_OPEN)
                            ? parseMethodCall(expr, true)
                            : throwExpected(TOKEN_IDENT, TOKEN_METHOD_OPEN, TOKEN_$METHOD_OPEN);
                    break;

                case TOKEN_DOT_OPEN_PAREN:
                    expr = parseMap(expr);
                    break;

                case TOKEN_DOT_OPEN_BRACKET:
                    expr = parseFilter(expr);
                    break;

                case TOKEN_DOT_DOT:
                case TOKEN_DOT_DOT_OPEN_PAREN:
                    expr = parseMapRecursive(expr);
                    break;

                case TOKEN_OPEN_BRACKET:
                    // Ambiguity: either slice notation or bracket access. Try slice
                    // first (backtracks on failure) otherwise treat as access.
                    expr = maybe(parseSliceNotation, expr) || parseBracketAccess(expr);
                    break;

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
                return parseGetProperty();

            case TOKEN_METHOD_OPEN:
            case TOKEN_$METHOD_OPEN:
                return parseMethodCall();

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

    function parseAssertionPostfix(argument) {
        const start = legacyPrefixStartRange(argument);

        advance(TOKEN_IS);

        return {
            type: 'Postfix',
            operator: parseAssertion(),
            argument,
            range: endRange(start)
        };
    }

    function parseAssertion() {
        const start = startRange();
        const negation = advanceIfMatch(TOKEN_NOT) !== null;
        let assertion = [];

        // Assertion grammar allows nested parenthesized boolean combinations
        // joined by 'and' / 'or', plus identifiers, literals, and a legacy quirk
        // where $ident becomes an empty Method call (FIXME below).
        switch (current.type) {
            case TOKEN_OPEN_PAREN:
                advance(TOKEN_OPEN_PAREN);

                do {
                    if (assertion.length) {
                        assertion.push(
                            match(TOKEN_AND) || match(TOKEN_OR)
                                ? getValueAndAdvance()
                                : throwExpected(TOKEN_AND, TOKEN_OR)
                        );
                    }

                    assertion.push(parseAssertion());
                } while (!advanceIfMatch(TOKEN_CLOSE_PAREN));

                break;

            case TOKEN_IDENT:
            case TOKEN_LITERAL:
                assertion = parseIdentifier();
                break;

            case TOKEN_$IDENT:
                // Legacy: $variable in assertion context -> Method node with no args.
                // FIXME: Should be a simple Reference; adjust after parity phase.
                assertion = createMethod(parseReference(), [], endRange(start));
                break;

            default:
                throwExpected(TOKEN_OPEN_PAREN, TOKEN_IDENT, TOKEN_LITERAL, TOKEN_$IDENT);
        }

        return {
            type: 'Assertion',
            negation,
            assertion,
            range: endRange(start)
        };
    }

    function parseGetProperty(value = null, prefixed = false) {
        const start = legacyPrefixStartRange(value);

        if (prefixed) {
            advance(TOKEN_DOT);
        }

        const property = parseIdentifier();

        return {
            type: 'GetProperty',
            value,
            property,
            range: endRange(start)
        };
    }

    function parseMethod() {
        const start = startRange();
        const methodRef = match(TOKEN_METHOD_OPEN)
            ? parseIdentifier()
            : match(TOKEN_$METHOD_OPEN)
                ? parseReference()
                : throwExpected(TOKEN_METHOD_OPEN, TOKEN_$METHOD_OPEN);

        const args = [];
        if (!match(TOKEN_CLOSE_PAREN)) {
            do {
                args.push(parseExpression());
            } while (advanceIfMatch(TOKEN_COMMA));
        }

        advance(TOKEN_CLOSE_PAREN);

        return createMethod(methodRef, args, endRange(start));
    }

    function parseMethodCall(value = null, prefixed = false) {
        const start = legacyPrefixStartRange(value);

        if (prefixed) {
            advance(TOKEN_DOT);
        }

        const method = parseMethod();

        return {
            type: 'MethodCall',
            value,
            method,
            range: endRange(start)
        };
    }

    function parseTemplate() {
        const start = startRange();
        const values = [];

        if (match(TOKEN_TEMPLATE)) {
            values.push(parseLiteralValue());
        } else {
            // Token sequence: TPL_START ( expr TPL_CONTINUE )* TPL_END
            values.push(parseLiteralValue(TOKEN_TPL_START));

            while (true) {
                values.push(parseExpression());

                if (!match(TOKEN_TPL_CONTINUE)) {
                    break;
                }

                values.push(parseLiteralValue(TOKEN_TPL_CONTINUE));
            }

            values.push(parseLiteralValue(TOKEN_TPL_END));
        }

        return {
            type: 'Template',
            values,
            range: endRange(start)
        };
    }

    function parseFunction() {
        const start = startRange();
        const args = [];

        if (advanceIfMatch(TOKEN_OPEN_PAREN)) {
            // Parameter list (standard form)
            if (!match(TOKEN_CLOSE_PAREN)) {
                do {
                    args.push(parseIdentifier());
                } while (advanceIfMatch(TOKEN_COMMA));
            }

            advance(TOKEN_CLOSE_PAREN);
        } else if (match(TOKEN_$IDENT)) {
            args.push(parseIdentifier());
        }

        advance(TOKEN_ARROW);

        const body = parseExpression() || throwError('Expected non-empty expression');
        return {
            type: 'Function',
            arguments: args,
            body,
            range: endRange(start)
        };
    }

    function parseCompareFunction(expr) {
        const start = legacyPrefixStartRange(expr);
        const compares = [parseCompare(expr)];

        while (advanceIfMatch(TOKEN_COMMA)) {
            // Ensure we don't nest CompareFunction nodes by parsing RHS with
            // tighter precedence than ORDER itself.
            compares.push(
                parseCompare(parseExpression(PRECEDENCE[TOKEN_ORDER] + 1))
            );
        }

        return {
            type: 'CompareFunction',
            compares,
            range: endRange(start)
        };
    }

    function parseCompare(query) {
        const start = legacyPrefixStartRange(query);
        const order = getValueAndAdvance(TOKEN_ORDER);

        return {
            type: 'Compare',
            query,
            order,
            range: endRange(start)
        };
    }

    function parseParentheses() {
        const start = startRange();
        advance(TOKEN_OPEN_PAREN);

        const definitions = parseDefinitions();
        const expression = parseExpression() || createPlaceholder();

        advance(TOKEN_CLOSE_PAREN);

        // Legacy: definitions inside parentheses produce a Block node wrapper.
        return {
            type: 'Parentheses',
            body: definitions.length > 0
                ? createBlock(definitions, expression, endRange(start))
                : expression,
            range: endRange(start)
        };
    }

    function parseArray() {
        const start = startRange();
        const elements = [];

        advance(TOKEN_OPEN_BRACKET);

        if (!advanceIfMatch(TOKEN_CLOSE_BRACKET)) {
            do {
                if (match(TOKEN_COMMA)) {
                    throwError('Expected expression before comma');
                }

                elements.push(
                    match(TOKEN_DOT_DOT_DOT)
                        ? parseSpread(SPREAD_ARRAY)
                        : parseExpression()
                );
            } while (advanceIfMatch(TOKEN_COMMA) && !match(TOKEN_CLOSE_BRACKET));

            advance(TOKEN_CLOSE_BRACKET);
        }

        return {
            type: 'Array',
            elements,
            range: endRange(start)
        };
    }

    // Slice notation: [ e : e (: e)? ]
    function parseSliceNotation(expr = null) {
        const start = legacyPrefixStartRange(expr);
        const args = [
            consumeSurrounded(             // first expression before ':'
                TOKEN_OPEN_BRACKET,
                parseExpression,
                TOKEN_COLON
            ),
            parseExpression()              // "e"
        ];

        // Optional third expression
        if (advanceIfMatch(TOKEN_COLON)) { // ":"
            args.push(parseExpression());  // "e"
        }

        advance(TOKEN_CLOSE_BRACKET);      // "]"

        return {
            type: 'SliceNotation',
            value: expr,
            arguments: args,
            range: endRange(start)
        };
    }

    function parseObject() {
        const start = startRange();

        advance(TOKEN_OPEN_BRACE);

        // Allow leading local definitions (mirrors Block behavior)
        const definitions = parseDefinitions();
        const properties = [];

        if (!match(TOKEN_CLOSE_BRACE)) {
            // Allow trailing comma
            do {
                properties.push(
                    match(TOKEN_DOT_DOT_DOT)
                        ? parseSpread(SPREAD_OBJECT)
                        : parseObjectEntry()
                );
            } while (advanceIfMatch(TOKEN_COMMA) && !match(TOKEN_CLOSE_BRACE));
        }

        advance(TOKEN_CLOSE_BRACE);

        const object = {
            type: 'Object',
            properties,  // FIXME: rename to entries
            range: endRange(start)
        };

        // Legacy: wrap with Block when definitions present (FIXME to remove)
        return definitions.length > 0
            ? createBlock(definitions, object, endRange(start))
            : object;
    }

    // FIXME: The shape of ObjectEntry should be changed to allow string values as key
    // and pipeline property to avoid building Pipeline nodes
    function parseObjectEntry() {
        const start = startRange();
        let key;
        let value = null;
        let pipeline = null;

        switch (current.type) {
            case TOKEN_METHOD_OPEN:
            case TOKEN_$METHOD_OPEN: {
                // Shorthand method entry: { size() } or { $length() }
                const method = parseMethod();

                // FIXME: Parity with legacy parser
                key = {
                    type: 'Literal',
                    value: method.reference.type === 'Identifier'
                        ? method.reference.name
                        : method.reference.name.name,
                    range: undefined
                };
                value = method;

                // Check for continuation: { size() bool() } or { size().(expr) }
                if (!match(TOKEN_COMMA) && !match(TOKEN_CLOSE_BRACE) && !match(TOKEN_EOF)) {
                    pipeline = value;
                    // FIXME: Parity with legacy parser
                    value = parsePipeline(pipeline, true);
                }
                break;
            }

            case TOKEN_IDENT: {
                if (nextMatch(TOKEN_COLON) || nextMatch(TOKEN_COMMA) || nextMatch(TOKEN_CLOSE_BRACE) || nextMatch(TOKEN_EOF)) {
                    key = parseIdentifier();
                } else {
                    // Shorthand with continuation: { foo .bar } or { foo .[x] }
                    pipeline = parseGetProperty(null, false);
                    key = pipeline.property;
                    // FIXME: Parity with legacy parser
                    value = parsePipeline(pipeline, true);
                }
                break;
            }

            case TOKEN_$IDENT: {
                if (nextMatch(TOKEN_COLON)) {
                    key = parseIdentifier(true);
                } else {
                    key = parseReference();

                    if (!match(TOKEN_COMMA) && !match(TOKEN_CLOSE_BRACE) && !match(TOKEN_EOF)) {
                        // Shorthand with continuation: { $var.size() }
                        pipeline = key;
                        key = key.name;
                        // FIXME: Parity with legacy parser
                        value = parsePipeline(pipeline, true);
                    }
                }
                break;
            }

            case TOKEN_LITERAL:
            case TOKEN_STRING:
            case TOKEN_NUMBER:
                key = parseLiteralValue();
                break;

            case TOKEN_$:
                key = parseSpecialReference();
                break;

            case TOKEN_OPEN_BRACKET: // Computed property name: [expression]
                key = consumeSurrounded(
                    TOKEN_OPEN_BRACKET,
                    parseExpression,
                    TOKEN_CLOSE_BRACKET
                );
                advance(TOKEN_COLON);
                value = parseExpression();
                break;

            default:
                throwExpected(
                    TOKEN_IDENT, TOKEN_LITERAL, TOKEN_STRING, TOKEN_NUMBER,
                    TOKEN_$, TOKEN_$IDENT, TOKEN_OPEN_BRACKET,
                    TOKEN_METHOD_OPEN, TOKEN_$METHOD_OPEN
                );
        }

        if (!pipeline && !value) {
            value = advanceIfMatch(TOKEN_COLON) ? parseExpression() : null;
        }

        return {
            type: 'ObjectEntry',
            key,
            value,
            range: endRange(start)
        };
    }

    function parseSpread(array) {
        const start = startRange();
        const query = advance(TOKEN_DOT_DOT_DOT) && parseExpression();

        return {
            type: 'Spread',
            query,
            array,
            range: endRange(start)
        };
    }


    function parseBracketAccess(value) {
        const start = legacyPrefixStartRange(value);
        const getter = consumeSurrounded(
            TOKEN_OPEN_BRACKET,
            parseExpression,
            TOKEN_CLOSE_BRACKET
        );

        return {
            type: 'Pick',
            value,
            getter,
            range: endRange(start)
        };
    }

    function parseMap(value) {
        const start = legacyPrefixStartRange(value);
        const query = consumeSurrounded(
            TOKEN_DOT_OPEN_PAREN,
            parseBlock,
            TOKEN_CLOSE_PAREN
        );

        return {
            type: 'Map',
            value,
            query,
            range: endRange(start)
        };
    }

    function parseMapRecursive(value) {
        const start = legacyPrefixStartRange(value);
        // Two syntactic forms:
        //   ..ident / ..method(...)
        //   ..( <block> )
        const query = advanceIfMatch(TOKEN_DOT_DOT)
            ? match(TOKEN_IDENT)
                ? parseGetProperty()
                : parseMethodCall()
            : consumeSurrounded(
                TOKEN_DOT_DOT_OPEN_PAREN,
                parseBlock,
                TOKEN_CLOSE_PAREN
            );

        return {
            type: 'MapRecursive',
            value,
            query,
            range: endRange(start)
        };
    }

    function parseFilter(value) {
        const start = legacyPrefixStartRange(value);
        const query = consumeSurrounded(
            TOKEN_DOT_OPEN_BRACKET,
            parseBlock,
            TOKEN_CLOSE_BRACKET
        );

        return {
            type: 'Filter',
            value,
            query,
            range: endRange(start)
        };
    }

    function parsePipeline(left, implicit = false) {
        const start = legacyPrefixStartRange(left);

        if (implicit) {
            advanceIfMatch(TOKEN_PIPE);
        } else {
            advance(TOKEN_PIPE);
        }

        // Right side may start with local definitions (mirrors top-level Block).
        const definitions = !implicit ? parseDefinitions() : [];
        const body = !implicit
            ? parseExpression(PRECEDENCE[TOKEN_PIPE] + 1) || createPlaceholder()
            : parsePostfix();

        // If we have definitions, wrap in a Block like legacy parser does
        // FIXME: The block wrapper should be removed
        const right = definitions.length > 0
            ? createBlock(definitions, body, endRange(start))
            : body;

        return {
            type: 'Pipeline',
            left,
            right,
            range: endRange(start)
        };
    }

    function parseTernaryConditional(test, prec) {
        const start = legacyPrefixStartRange(test);

        advance(TOKEN_QUESTION);

        const consequent = parseExpression(prec) || createPlaceholder();
        const alternate = advanceIfMatch(TOKEN_COLON)
            ? parseExpression(prec) || createPlaceholder() // '? a :' -> Placeholder
            : null;                                        // '? a'   -> null

        return {
            type: 'Conditional',
            test,
            consequent,
            alternate,
            range: endRange(start)
        };
    }

    function parseBinaryOperator(left, prec) {
        const start = legacyPrefixStartRange(left);
        const operator = getValueAndAdvance();
        const right = parseExpression(prec) || throwError('Expected expression');

        return {
            type: 'Binary',
            operator,
            left,
            right,
            range: endRange(start)
        };
    }
}
