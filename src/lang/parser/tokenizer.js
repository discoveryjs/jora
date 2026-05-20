import { TOLERANT_TOKEN_PAIRS } from './tokenizer-tolerant-token-pairs.js';
import {
    TOKEN_NUMBER, TOKEN_STRING, TOKEN_REGEXP, TOKEN_LITERAL, TOKEN_IDENT, TOKEN_$IDENT,
    TOKEN_$, TOKEN_$$, TOKEN_METHOD_OPEN, TOKEN_$METHOD_OPEN,
    TOKEN_TEMPLATE, TOKEN_TPL_START, TOKEN_TPL_CONTINUE, TOKEN_TPL_END,
    TOKEN_DIVIDE, TOKEN_BAD, TOKEN_EOF,
    BALANCE_TOKEN_PAIR, KEYWORDS, STR_TO_TOKEN, PREVENT_PRIMITIVE, PREVENT_KEYWORD, KEYWORD_TOKENS,
    tokenNames
} from './tokens.js';

// Predefined regex for efficient identifier reading
const COMMENT_RX = /\/\/.*?(?:\n|\r\n?|\u2028|\u2029|$)|\/\*(?:.|\s)*?(?:\*\/|$)/y;
const WHITESPACE_RX = /\s+/y;
const REST_TOKENS_RX = new RegExp(Object.keys(STR_TO_TOKEN).map(s => s.replace(/[\[\]{}()^$|?*+.]/g, '\\$&')).join('|'), 'y');
const IDENTIFIER_RX = /(?:(?:[a-zA-Z_]|\\u[0-9a-fA-F]{4})(?:[a-zA-Z_$0-9]|\\u[0-9a-fA-F]{4})*)\b/y;
const KEYWORD_RX = /(?:has no|not in|and|or|not|has|is|in|no|(?:asc|desc)(?:NA?|AN?)?)\b/y;
const REGEXP_RX = /\/(?:\\.|[^/])+\/[gimsu]*/y;
const NUMBER_RX = /(?:[_\d]*\.)?[_\d]+(?:[eE][-+]?[_\d]+)?\b|0[xX][_0-9a-fA-F]+\b/y;
// RegExps are relaxed to allow broken strings; strings are validated during conversion into literals.
// This provides better error messages, as it allows locating the exact problem position.
const STRING_RX = /"(?:\\.|[^"])*"|'(?:\\.|[^'])*'/sy;
const TEMPLATE_START_RX = /`(?:\\.|[^`\\$]|\$(?!\{))*(\$\{|`)/sy;
const TEMPLATE_CONT_END_RX = /\}(?:\\.|[^`\\$]|\$(?!\{))*(\$\{|`)/sy;

// Literal value lookup
export const LITERALS = new Map([
    ['true', true],
    ['false', false],
    ['null', null],
    ['undefined', undefined],
    ['Infinity', Infinity],
    ['NaN', NaN]
]);

export class Token {
    #input;
    #value;
    constructor(type, start, end, input, value = null) {
        this.type = type;
        this.start = start;
        this.end = end;
        this.#input = input;
        this.#value = value;
    }
    get name() {
        return tokenNames[this.type];
    }
    get value() {
        return this.#value ?? this.#input.slice(this.start, this.end);
    }
}

export function* tokenize(input, tolerant = false) {
    const nextToken = createTokenizer(input, tolerant);
    let token;

    while (token = nextToken()) {
        yield token;
    }
}

export function createTokenizer(input, options) {
    const {
        tolerant: tolerantMode = false,
        onComment: onCommentHandler = []
    } = typeof options === 'boolean'
        ? { tolerant: options }
        : options || {};
    const onComment = typeof onCommentHandler === 'function'
        ? onCommentHandler
        : Array.isArray(onCommentHandler)
            ? (start, end) => onCommentHandler.push([start, end])
            : () => {};

    const length = input.length;
    let pos = 0;
    let done = false;
    let bracketStack = [];
    let preventPrimitive = false;
    let preventKeyword = false;
    let pendingToken = null;
    let prevTokenType = null;
    let prevTokenEnd = 0;

    function advance(count = 1) {
        pos = Math.min(pos + count, length);
    }

    function match(regexp) {
        regexp.lastIndex = pos;
        const match = regexp.exec(input);

        if (match) {
            const value = match[0];
            advance(value.length);
            return value;
        }

        return null;
    }

    function peek(offset = 0) {
        const index = pos + offset;
        return index < length ? input[index] : '';
    }

    function isIdentStart(ch) {
        return (
            (ch >= 'A' && ch <= 'Z') || // A-Z
            (ch >= 'a' && ch <= 'z') || // a-z
            (ch === '_')              || /* _ */
            (ch === '\\' && peek(1) === 'u')
        );
    }

    function isNumberStart(ch) {
        if (ch >= '0' && ch <= '9') { // 0-9
            return true;
        }

        if (ch === '.') {
            const next = peek(1);
            return (next >= '0' && next <= '9') || next === '_';
        }

        return false;
    }

    function trackBracketBalance(tokenType) {
        if (BALANCE_TOKEN_PAIR[tokenType] !== -1) {
            bracketStack.push(BALANCE_TOKEN_PAIR[tokenType]);
        } else if (bracketBalanceTop() === tokenType) {
            bracketStack.pop();
        }
    }

    function bracketBalanceTop() {
        return bracketStack.length > 0
            ? bracketStack[bracketStack.length - 1]
            : -1;
    }

    // Tolerant mode tokenization wrapper
    function nextTokenTolerant(token) {
        // Check if we need to insert an empty IDENT in tolerant mode
        const shouldInsertEmptyIdent =
            tolerantMode &&
            TOLERANT_TOKEN_PAIRS.get(prevTokenType)?.[token.type];

        if (shouldInsertEmptyIdent) {
            // Store new token as pending
            pendingToken = token;

            // Determine empty IDENT range based on surrounding token types:
            // - After keyword or before keyword: zero-width range
            // - Otherwise (after dot/operator, before operator/EOF): spans the gap
            let emptyStart;
            let emptyEnd;

            if (prevTokenType === null) {
                // First injected ident (no previous token): starts at input beginning
                emptyStart = 0;
                emptyEnd = KEYWORD_TOKENS[token.type]
                    ? Math.max(0, token.start - 1)
                    : token.start;
            } else if (KEYWORD_TOKENS[prevTokenType]) {
                // Previous is a keyword: zero-width at next token
                emptyStart = token.start;
                emptyEnd = token.start;
            } else if (KEYWORD_TOKENS[token.type]) {
                // Next token is a keyword: span from previous token's end
                // to just before the keyword (absorb whitespace gap)
                emptyStart = prevTokenEnd;
                emptyEnd = Math.max(prevTokenEnd, token.start - 1);
            } else {
                // Normal case: span from previous token's end to next token's start
                emptyStart = prevTokenEnd;
                emptyEnd = token.start;
            }

            return new Token(TOKEN_IDENT, emptyStart, emptyEnd, input, '');
        }

        // Normal token processing
        prevTokenType = token.type;
        prevTokenEnd = token.end;
        return token;
    }

    // Strict mode tokenization
    function nextTokenStrict() {
        if (pos >= length) {
            done = true;
            return TOKEN_EOF;
        }

        const start = pos;
        const ch = input[pos];

        // Numbers
        if (isNumberStart(ch) && match(NUMBER_RX)) {
            return TOKEN_NUMBER;
        }

        // Strings
        if ((ch === '"' || ch === "'") && match(STRING_RX)) {
            return TOKEN_STRING;
        }

        // Template literal/template start
        if (ch === '`' && match(TEMPLATE_START_RX)) {
            return input[pos - 1] == '`'
                ? TOKEN_TEMPLATE
                : TOKEN_TPL_START;
        }

        // Template continuation/end
        if (ch === '}' && bracketBalanceTop() === TOKEN_TPL_END && match(TEMPLATE_CONT_END_RX)) {
            return input[pos - 1] === '`'
                ? TOKEN_TPL_END
                : TOKEN_TPL_CONTINUE;
        }

        // Regular expressions (context-aware using state)
        if (ch === '/') {
            // If preventPrimitive state is active, treat as division
            if (!preventPrimitive && match(REGEXP_RX)) {
                return TOKEN_REGEXP;
            }

            // Treat as division if it doesn't look like regex
            advance();
            return TOKEN_DIVIDE;
        }

        // Identifiers and method calls
        if (isIdentStart(ch)) {
            // Keywords
            if (!preventKeyword && match(KEYWORD_RX)) {
                return KEYWORDS[input.slice(start, pos)];
            }

            if (match(IDENTIFIER_RX)) {
                // Check for literals
                if (!preventKeyword && LITERALS.has(input.slice(start, pos))) {
                    return TOKEN_LITERAL;
                }

                // Check for method call
                if (peek() === '(') {
                    advance(); // consume the (
                    return TOKEN_METHOD_OPEN;
                }

                return TOKEN_IDENT;
            }
        }

        // Variable references and special symbols
        if (ch === '$') {
            advance();

            if (peek() === '$') {
                advance();
                return TOKEN_$$;
            }

            if (match(IDENTIFIER_RX)) {
                // Check for $method(
                if (peek() === '(') {
                    advance(); // consume the (
                    return TOKEN_$METHOD_OPEN;
                }

                return TOKEN_$IDENT;
            }

            return TOKEN_$;
        }

        // Rest tokens check
        if (match(REST_TOKENS_RX)) {
            return STR_TO_TOKEN[input.slice(start, pos)];
        }

        pos++;
        return TOKEN_BAD;
    }

    function scanComment() {
        const start = pos;

        if (match(COMMENT_RX)) {
            onComment(start, pos, input);
            return true;
        }

        return false;
    }

    return function nextToken() {
        // Check for pending token first
        if (pendingToken) {
            // Get and clear pending token
            const token = pendingToken;

            pendingToken = null;
            prevTokenType = token.type;
            prevTokenEnd = token.end;

            return token;
        }

        if (done) {
            return null;
        }

        // Skip whitespace and comments first
        do {
            if (match(WHITESPACE_RX)) {
                preventKeyword = false;
            }
        } while (scanComment());

        // Read next token
        const start = pos;
        const nextTokenType = nextTokenStrict();
        const token = new Token(nextTokenType, start, pos, input);

        preventPrimitive = PREVENT_PRIMITIVE[nextTokenType];
        preventKeyword = PREVENT_KEYWORD[nextTokenType];
        trackBracketBalance(nextTokenType);

        return tolerantMode
            ? nextTokenTolerant(token)
            : token;
    };
}
