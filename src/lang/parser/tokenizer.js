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

export class Tokenizer {
    constructor(input, tolerantMode = false) {
        this.input = input;
        this.pos = 0;
        this.length = input.length;

        this.bracketStack = [];
        this.preventPrimitive = false;
        this.preventKeyword = false;

        // Tolerant mode support
        this.tolerantMode = tolerantMode;
        this.pendingToken = null;
        this.prevToken = null;
    }

    advance(count = 1) {
        this.pos = Math.min(this.pos + count, this.length);
    }

    match(regexp) {
        regexp.lastIndex = this.pos;
        const match = regexp.exec(this.input);

        if (match) {
            const value = match[0];
            this.advance(value.length);
            return value;
        }

        return null;
    }

    peek(offset = 0) {
        const index = this.pos + offset;
        return index < this.length ? this.input[index] : '';
    }

    isIdentStart(ch) {
        return (
            (ch >= 'A' && ch <= 'Z') || // A-Z
            (ch >= 'a' && ch <= 'z') || // a-z
            (ch === '_')              || /* _ */
            (ch === '\\' && this.peek(1) === 'u')
        );
    }

    isNumberStart(ch) {
        return (
            isDigit(ch) ||
            (ch === '.' && (isDigit(this.peek(1)) || this.peek(1) === '_'))
        );
    }

    trackBracketBalance(tokenType) {
        if (OPEN_CLOSE_TOKEN_PAIR.has(tokenType)) {
            this.bracketStack.push(OPEN_CLOSE_TOKEN_PAIR.get(tokenType));
        } else if (this.bracketBalanceTop() === tokenType) {
            this.bracketStack.pop();
        }
    }

    bracketBalanceTop() {
        return this.bracketStack.length > 0
            ? this.bracketStack[this.bracketStack.length - 1]
            : -1;
    }

    // createToken(tokenType) {}

    // Main tokenization method
    nextToken() {
        // Check for pending token first
        if (this.pendingToken) {
            // Get and clear pending token
            const token = this.pendingToken;

            this.pendingToken = null;
            this.prevToken = token.type;

            return token;
        }

        return this.tolerantMode
            ? this.nextTokenTolerant()
            : this.nextTokenStrict();
    }

    // Tolerant mode tokenization wrapper
    nextTokenTolerant() {
        const token = this.nextTokenStrict();

        // Check if we need to insert an empty IDENT in tolerant mode
        const shouldInsertEmptyIdent =
            this.tolerantMode &&
            TOLERANT_TOKEN_PAIRS.has(this.prevToken) &&
            TOLERANT_TOKEN_PAIRS.get(this.prevToken).has(token.type);

        if (shouldInsertEmptyIdent) {
            // Store new token as pending
            this.pendingToken = token;

            // Create empty IDENT token at the position where the previous token ended
            return new Token(TOKEN_IDENT, '', this.pos);
        }

        // Normal token processing
        this.prevToken = token.type;
        return token;
    }

    // Strict mode tokenization
    nextTokenStrict() {
        // Skip whitespace and comments first
        do {
            if (this.match(WHITESPACE_RX)) {
                this.preventKeyword = false;
            }
        } while (this.match(COMMENT_RX));

        // Check and consume state flags (they affect current token only)
        const preventPrimitive = this.preventPrimitive;
        const preventKeyword = this.preventKeyword;

        // Clear flags after reading them (single-use)
        this.preventPrimitive = false;
        this.preventKeyword = false;

        if (this.pos >= this.length) {
            return new Token(TOKEN_EOF, '', this.pos);
        }

        const input = this.input;
        const ch = input[this.pos];
        const start = this.pos;

        // Numbers (optimized character code check)
        if (this.isNumberStart(ch)) {
            const num = this.match(NUMBER_RX) || this.match(HEX_NUMBER_RX);

            if (num !== null) {
                this.preventPrimitive = true;

                return new Token(TOKEN_NUMBER, this.toNumberLiteral(num), start);
            }
        }

        // Strings
        if (ch === '"' || ch === "'") {
            const str = this.match(STRING_RX);

            if (str !== null) {
                this.preventPrimitive = true;

                return new Token(TOKEN_STRING, this.toStringLiteral(str), start);
            }
        }

        // Template literal/template start
        if (ch === '`') {
            const template = this.match(TEMPLATE_START_RX);

            if (template) {
                // Check if this is a simple template (ends with `) or start of complex one (${)
                if (template.endsWith('`')) {
                    this.preventPrimitive = true;
                    return new Token(TOKEN_TEMPLATE, this.toStringLiteral(template, true, 1), start);
                }

                // This is the start of a template with interpolation
                this.trackBracketBalance(TOKEN_TPL_START);
                return new Token(TOKEN_TPL_START, this.toStringLiteral(template, true, 2), start);
            }
        }

        // Template continuation/end
        if (ch === '}' && this.bracketBalanceTop() === TOKEN_TPL_END) {
            const template = this.match(TEMPLATE_CONT_END_RX);

            if (template) {
                if (template.endsWith('`')) {
                    // This is the end of the template
                    this.trackBracketBalance(TOKEN_TPL_END);
                    this.preventPrimitive = true;
                    return new Token(TOKEN_TPL_END, this.toStringLiteral(template, true, 1), start);
                }

                // This is a continuation of the template
                return new Token(TOKEN_TPL_CONTINUE, this.toStringLiteral(template, true, 2), start);
            }
        }

        // Regular expressions (context-aware using state)
        if (ch === '/') {
            // If preventPrimitive state is active, treat as division
            if (!preventPrimitive) {
                const regexp = this.match(REGEXP_RX);

                if (regexp !== null) {
                    this.preventPrimitive = true; // Set state for next token

                    return new Token(
                        TOKEN_REGEXP,
                        this.toRegExp(regexp),
                        start
                    );
                }
            }

            // Treat as division if it doesn't look like regex
            this.advance();
            return new Token(TOKEN_DIVIDE, '/', start);
        }

        // Keywords (unified processing)
        if (!preventKeyword && this.isIdentStart(ch)) {
            const keyword = this.match(KEYWORD_RX);

            if (keyword) {
                return new Token(KEYWORDS.get(keyword), keyword, start);
            }
        }

        // Identifiers and method calls
        if (this.isIdentStart(ch)) {
            const value = this.match(IDENTIFIER_RX);

            // Check for literals using Map lookup
            if (!preventKeyword && LITERALS.has(value)) {
                this.preventPrimitive = true; // Set state for next token
                // Convert literal to actual value
                return new Token(TOKEN_LITERAL, LITERALS.get(value), start);
            }

            // Check for method call
            if (this.peek() === '(') {
                this.advance(); // consume the (
                this.trackBracketBalance(TOKEN_METHOD_OPEN);
                return new Token(TOKEN_METHOD_OPEN, value + '(', start);
            }

            this.preventPrimitive = true; // Set state for next token
            return new Token(TOKEN_IDENT, value, start);
        }

        // Variable references and special symbols
        if (ch === '$') {
            this.advance();

            if (this.peek() === '$') {
                this.advance(1);
                this.preventPrimitive = true; // Set state for next token

                return new Token(TOKEN_$$, '$$', start);
            }

            const ident = this.match(IDENTIFIER_RX);

            if (ident) {
                // Check for $method(
                if (this.peek() === '(') {
                    this.advance(); // consume the (
                    this.trackBracketBalance(TOKEN_$METHOD_OPEN);

                    return new Token(TOKEN_$METHOD_OPEN, '$' + ident + '(', start);
                }

                this.preventPrimitive = true; // Set state for next token
                return new Token(TOKEN_$IDENT, '$' + ident, start);
            }

            this.preventPrimitive = true; // Set state for next token
            return new Token(TOKEN_$, '$', start);
        }

        // Rest tokens check
        const restToken = this.match(REST_TOKENS_RX);

        if (restToken) {
            const tokenType = STR_TO_TOKEN.get(restToken);

            // Set preventPrimitive state for tokens that should trigger it
            if (tokenType === TOKEN_AT || tokenType === TOKEN_HASH ||
                tokenType === TOKEN_CLOSE_PAREN || tokenType === TOKEN_CLOSE_BRACKET ||
                tokenType === TOKEN_CLOSE_BRACE || tokenType === TOKEN_DOT) {
                this.preventPrimitive = true;
            }

            // Set preventKeyword state for DOT_DOT tokens
            if (tokenType === TOKEN_DOT || tokenType === TOKEN_DOT_DOT) {
                this.preventKeyword = true;
            }

            this.trackBracketBalance(tokenType);

            return new Token(tokenType, restToken, start);
        }

        throw new Error(`Unexpected character '${ch}' at position ${this.pos}`);
    }

    // Conversion methods (matching legacy parser)
    toNumberLiteral(value) {
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

    toStringLiteral(value, multiline = false, end = 1) {
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

    toRegExp(value) {
        const flags = value.match(/[^/]*$/)[0];

        for (let i = 0; i < flags.length; i++) {
            if (flags.includes(flags[i], i + 1)) {
                throw new Error('Duplicate flag in regexp');
            }
        }

        return new RegExp(value.slice(1, -flags.length - 1), flags);
    }

    // State management methods for parser backtracking
    saveState() {
        return {
            pos: this.pos,
            bracketStack: [...this.bracketStack],
            preventPrimitive: this.preventPrimitive,
            preventKeyword: this.preventKeyword,
            pendingToken: this.pendingToken,
            prevToken: this.prevToken
        };
    }

    restoreState(state) {
        this.pos = state.pos;
        this.bracketStack = state.bracketStack;
        this.preventPrimitive = state.preventPrimitive;
        this.preventKeyword = state.preventKeyword;
        this.pendingToken = state.pendingToken;
        this.prevToken = state.prevToken;
    }
}
