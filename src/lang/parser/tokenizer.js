import { TOLERANT_TOKEN_PAIRS } from './tokenizer-tolerant-token-pairs.js';
import {
    TOKEN_NUMBER, TOKEN_STRING, TOKEN_REGEXP, TOKEN_LITERAL, TOKEN_IDENT, TOKEN_$IDENT,
    TOKEN_AT, TOKEN_HASH, TOKEN_$, TOKEN_$$, TOKEN_METHOD_OPEN, TOKEN_$METHOD_OPEN,
    TOKEN_TEMPLATE, TOKEN_TPL_START, TOKEN_TPL_CONTINUE, TOKEN_TPL_END,
    TOKEN_DOT, TOKEN_DOT_DOT, TOKEN_DIVIDE, TOKEN_CLOSE_PAREN, TOKEN_CLOSE_BRACKET,
    TOKEN_CLOSE_BRACE, TOKEN_EOF, OPEN_CLOSE_TOKEN_PAIR, KEYWORDS, STR_TO_TOKEN,
    tokenNames
} from './tokens.js';

// Predefined regex for efficient identifier reading
const COMMENT_RX = /\/\/.*?(?:\n|\r\n?|\u2028|\u2029|$)|\/\*(?:.|\s)*?(?:\*\/|$)/y;
const WHITESPACE_RX = /\s+/y;
const REST_TOKENS_RX = new RegExp([...STR_TO_TOKEN.keys()].map(s => s.replace(/[\[\]{}()^$|?*+.]/g, '\\$&')).join('|'), 'y');
const IDENTIFIER_RX = /(?:(?:[a-zA-Z_]|\\u[0-9a-fA-F]{4})(?:[a-zA-Z_$0-9]|\\u[0-9a-fA-F]{4})*)\b/y;
const KEYWORD_RX = /(?:has no|not in|and|or|not|has|is|in|no|asc(?:NA?|AN?)?|desc(?:NA?|AN?)?)\b/y;
const REGEXP_RX = /\/(?:\\.|[^/])+\/[gimsu]*/y;
const NUMBER_RX = /(?:[_\d]*\.)?[_\d]+(?:[eE][-+]?[_\d]+)?\b/y;
const HEX_NUMBER_RX = /0[xX][_0-9a-fA-F]+\b/y;
// RegExps are relaxed to allow broken strings; strings are validated during conversion into literals.
// This provides better error messages, as it allows locating the exact problem position.
const STRING_RX = /"(?:\\.|[^"])*"|'(?:\\.|[^'])*'/sy;
const TEMPLATE_START_RX = /`(?:\\.|[^`\\$]|\$(?!\{))*(\$\{|`)/sy;
const TEMPLATE_CONT_END_RX = /\}(?:\\.|[^`\\$]|\$(?!\{))*(\$\{|`)/sy;

// Literal value lookup
const LITERALS = new Map([
    ['true', true],
    ['false', false],
    ['null', null],
    ['undefined', undefined],
    ['Infinity', Infinity],
    ['NaN', NaN]
]);

// Helper functions for character classification

function isDigit(ch) {
    return ch >= '0' && ch <= '9'; // 0-9
}

function isLineTerminator(ch) {
    return ch === '\n' || ch === '\r' || ch === '\u2028' || ch === '\u2029';
}

export class Token {
    constructor(type, value, offset = 0) {
        this.type = type;
        this.value = value;
        this.offset = offset;
    }
    get name() {
        return tokenNames[this.type];
    }
}

export function createTokenizer(input, tolerantMode = false) {
    const length = input.length;
    let pos = 0;
    let done = false;
    let bracketStack = [];
    let preventPrimitive = false;
    let preventKeyword = false;
    let pendingToken = null;
    let prevToken = null;

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
        return (
            isDigit(ch) ||
            (ch === '.' && (isDigit(peek(1)) || peek(1) === '_'))
        );
    }

    function trackBracketBalance(tokenType) {
        if (OPEN_CLOSE_TOKEN_PAIR.has(tokenType)) {
            bracketStack.push(OPEN_CLOSE_TOKEN_PAIR.get(tokenType));
        } else if (bracketBalanceTop() === tokenType) {
            bracketStack.pop();
        }
    }

    function bracketBalanceTop() {
        return bracketStack.length > 0
            ? bracketStack[bracketStack.length - 1]
            : -1;
    }

    // Conversion methods (matching legacy parser)
    function toNumberLiteral(value) {
        const hex = value.startsWith('0x') || value.startsWith('0X');

        if (value.includes('_')) {
            const errorMatch = value.match(hex
                ? /(?:^|[^0-9a-fA-F])_|_(?:[^0-9a-fA-F]|$)/
                : /(?:^|\D)_|_(?:\D|$)/
            );

            if (errorMatch) {
                const m = errorMatch[0];
                const message = m === '__'
                    ? 'Only one underscore is allowed'
                    : 'Wrong underscore';

                throw new Error(`${message} as numeric separator`);
            }

            value = value.replace(/_/g, '');
        }

        return hex
            ? parseInt(value, 16)
            : parseFloat(value);
    }

    function toStringLiteral(value, multiline = false, end = 1) {
        const valueEnd = value.length - end;

        if (!/[\\\r\n\u2028\u2029]/.test(value)) {
            return value.slice(1, valueEnd);
        }

        let result = '';

        for (let i = 1; i < valueEnd; i++) {
            const ch = value[i];

            if (!multiline && isLineTerminator(ch)) {
                throw new Error('Invalid line terminator');
            }

            if (ch !== '\\') {
                result += ch;
                continue;
            }

            if (i === valueEnd - 1) {
                throw new Error('Invalid backslash');
            }

            const next = value[++i];
            switch (next) {
                case '\r':
                    // ignore line terminator
                    i += value[i + 1] === '\n';  // \r\n
                    break;

                case '\n':
                case '\u2028':
                case '\u2029':
                    // ignore line terminator
                    break;

                case '0': result += '\0'; break;
                case 'b': result += '\b'; break;
                case 'n': result += '\n'; break;
                case 'r': result += '\r'; break;
                case 'f': result += '\f'; break;
                case 't': result += '\t'; break;
                case 'v': result += '\v'; break;

                case 'u': {
                    const [hex = ''] = value.slice(i + 1, i + 5).match(/^[0-9a-f]*/i) || [];

                    if (hex.length === 4) {
                        result += String.fromCharCode(parseInt(hex, 16));
                        i += 4;
                        break;
                    }

                    throw new Error('Invalid Unicode escape sequence');
                }

                case 'x': {
                    const [hex = ''] = value.slice(i + 1, i + 3).match(/^[0-9a-f]*/i) || [];

                    if (hex.length === 2) {
                        result += String.fromCharCode(parseInt(hex, 16));
                        i += 2;
                        break;
                    }

                    throw new Error('Invalid hexadecimal escape sequence');
                }

                default:
                    result += next;
            }
        }

        return result;
    }

    function toRegExp(value) {
        const flags = value.match(/[^/]*$/)[0];

        for (let i = 0; i < flags.length; i++) {
            if (flags.includes(flags[i], i + 1)) {
                throw new Error('Duplicate flag in regexp');
            }
        }

        return new RegExp(value.slice(1, -flags.length - 1), flags);
    }

    // Tolerant mode tokenization wrapper
    function nextTokenTolerant() {
        const token = nextTokenStrict();

        // Check if we need to insert an empty IDENT in tolerant mode
        const shouldInsertEmptyIdent =
            tolerantMode &&
            TOLERANT_TOKEN_PAIRS.has(prevToken) &&
            TOLERANT_TOKEN_PAIRS.get(prevToken).has(token.type);

        if (shouldInsertEmptyIdent) {
            // Store new token as pending
            pendingToken = token;

            // Create empty IDENT token at the position where the previous token ended
            return new Token(TOKEN_IDENT, '', pos);
        }

        // Normal token processing
        prevToken = token.type;
        return token;
    }

    // Strict mode tokenization
    function nextTokenStrict() {
        // Skip whitespace and comments first
        do {
            if (match(WHITESPACE_RX)) {
                preventKeyword = false;
            }
        } while (match(COMMENT_RX));

        // Check and consume state flags (they affect current token only)
        const currentPreventPrimitive = preventPrimitive;
        const currentPreventKeyword = preventKeyword;

        // Clear flags after reading them (single-use)
        preventPrimitive = false;
        preventKeyword = false;

        if (pos >= length) {
            done = true;
            return new Token(TOKEN_EOF, '', pos);
        }

        const ch = input[pos];
        const start = pos;

        // Numbers (optimized character code check)
        if (isNumberStart(ch)) {
            const num = match(NUMBER_RX) || match(HEX_NUMBER_RX);

            if (num !== null) {
                preventPrimitive = true;

                return new Token(TOKEN_NUMBER, toNumberLiteral(num), start);
            }
        }

        // Strings
        if (ch === '"' || ch === "'") {
            const str = match(STRING_RX);

            if (str !== null) {
                preventPrimitive = true;

                return new Token(TOKEN_STRING, toStringLiteral(str), start);
            }
        }

        // Template literal/template start
        if (ch === '`') {
            const template = match(TEMPLATE_START_RX);

            if (template) {
                // Check if this is a simple template (ends with `) or start of complex one (${)
                if (template.endsWith('`')) {
                    preventPrimitive = true;
                    return new Token(TOKEN_TEMPLATE, toStringLiteral(template, true, 1), start);
                }

                // This is the start of a template with interpolation
                trackBracketBalance(TOKEN_TPL_START);
                return new Token(TOKEN_TPL_START, toStringLiteral(template, true, 2), start);
            }
        }

        // Template continuation/end
        if (ch === '}' && bracketBalanceTop() === TOKEN_TPL_END) {
            const template = match(TEMPLATE_CONT_END_RX);

            if (template) {
                if (template.endsWith('`')) {
                    // This is the end of the template
                    trackBracketBalance(TOKEN_TPL_END);
                    preventPrimitive = true;
                    return new Token(TOKEN_TPL_END, toStringLiteral(template, true, 1), start);
                }

                // This is a continuation of the template
                return new Token(TOKEN_TPL_CONTINUE, toStringLiteral(template, true, 2), start);
            }
        }

        // Regular expressions (context-aware using state)
        if (ch === '/') {
            // If preventPrimitive state is active, treat as division
            if (!currentPreventPrimitive) {
                const regexp = match(REGEXP_RX);

                if (regexp !== null) {
                    preventPrimitive = true; // Set state for next token

                    return new Token(
                        TOKEN_REGEXP,
                        toRegExp(regexp),
                        start
                    );
                }
            }

            // Treat as division if it doesn't look like regex
            advance();
            return new Token(TOKEN_DIVIDE, '/', start);
        }

        // Keywords (unified processing)
        if (!currentPreventKeyword && isIdentStart(ch)) {
            const keyword = match(KEYWORD_RX);

            if (keyword) {
                return new Token(KEYWORDS.get(keyword), keyword, start);
            }
        }

        // Identifiers and method calls
        if (isIdentStart(ch)) {
            const value = match(IDENTIFIER_RX);

            // Check for literals using Map lookup
            if (!currentPreventKeyword && LITERALS.has(value)) {
                preventPrimitive = true; // Set state for next token
                // Convert literal to actual value
                return new Token(TOKEN_LITERAL, LITERALS.get(value), start);
            }

            // Check for method call
            if (peek() === '(') {
                advance(); // consume the (
                trackBracketBalance(TOKEN_METHOD_OPEN);
                return new Token(TOKEN_METHOD_OPEN, value + '(', start);
            }

            preventPrimitive = true; // Set state for next token
            return new Token(TOKEN_IDENT, value, start);
        }

        // Variable references and special symbols
        if (ch === '$') {
            advance();

            if (peek() === '$') {
                advance();
                preventPrimitive = true; // Set state for next token

                return new Token(TOKEN_$$, '$$', start);
            }

            const ident = match(IDENTIFIER_RX);

            if (ident) {
                // Check for $method(
                if (peek() === '(') {
                    advance(); // consume the (
                    trackBracketBalance(TOKEN_$METHOD_OPEN);

                    return new Token(TOKEN_$METHOD_OPEN, '$' + ident + '(', start);
                }

                preventPrimitive = true; // Set state for next token
                return new Token(TOKEN_$IDENT, '$' + ident, start);
            }

            preventPrimitive = true; // Set state for next token
            return new Token(TOKEN_$, '$', start);
        }

        // Rest tokens check
        const restToken = match(REST_TOKENS_RX);

        if (restToken) {
            const tokenType = STR_TO_TOKEN.get(restToken);

            // Set preventPrimitive state for tokens that should trigger it
            if (tokenType === TOKEN_AT || tokenType === TOKEN_HASH ||
                tokenType === TOKEN_CLOSE_PAREN || tokenType === TOKEN_CLOSE_BRACKET ||
                tokenType === TOKEN_CLOSE_BRACE || tokenType === TOKEN_DOT) {
                preventPrimitive = true;
            }

            // Set preventKeyword state for DOT_DOT tokens
            if (tokenType === TOKEN_DOT || tokenType === TOKEN_DOT_DOT) {
                preventKeyword = true;
            }

            trackBracketBalance(tokenType);

            return new Token(tokenType, restToken, start);
        }

        throw new Error(`Unexpected character '${ch}' at position ${pos}`);
    }

    function nextToken() {
        // Check for pending token first
        if (pendingToken) {
            // Get and clear pending token
            const token = pendingToken;

            pendingToken = null;
            prevToken = token.type;

            return token;
        }

        if (done) {
            return null;
        }

        return tolerantMode
            ? nextTokenTolerant()
            : nextTokenStrict();
    }

    function saveState() {
        return {
            pos,
            done,
            bracketStack: [...bracketStack],
            preventPrimitive,
            preventKeyword,
            pendingToken,
            prevToken
        };
    }

    function restoreState(state) {
        pos = state.pos;
        done = state.done;
        bracketStack = state.bracketStack;
        preventPrimitive = state.preventPrimitive;
        preventKeyword = state.preventKeyword;
        pendingToken = state.pendingToken;
        prevToken = state.prevToken;
    }

    return {
        nextToken,
        saveState,
        restoreState,
        get done() {
            return done;
        }
    };
}
