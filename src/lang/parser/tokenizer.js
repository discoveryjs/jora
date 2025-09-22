
// Import all token constants
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
    TOKEN_EOF, tokenNames
} from './tokens.js';
import { TOLERANT_TOKEN_PAIRS } from './tokenizer-tolerant-token-pairs.js';

// Regular expressions that are actually used
const ORDER_RE = /^(asc|desc)(NA?|AN?)?$/;

// Literal value lookup
const LITERALS = new Map([
    ['true', true],
    ['false', false],
    ['null', null],
    ['undefined', undefined],
    ['Infinity', Infinity],
    ['NaN', NaN]
]);

// Single-word keyword lookup
const KEYWORDS = new Map([
    ['and', TOKEN_AND],
    ['or', TOKEN_OR],
    ['not', TOKEN_NOT],
    ['no', TOKEN_NO],
    ['is', TOKEN_IS],
    ['in', TOKEN_IN],
    ['notin', TOKEN_NOTIN],
    ['has', TOKEN_HAS],
    ['hasno', TOKEN_HASNO]
]);

// Two-character operators
const TWO_CHAR_OPERATORS = new Map([
    ['..', TOKEN_DOT_DOT],
    ['.(', TOKEN_DOT_OPEN_PAREN],
    ['.[', TOKEN_DOT_OPEN_BRACKET],
    ['=>', TOKEN_ARROW],
    ['!=', TOKEN_NOT_EQUALS],
    ['~=', TOKEN_MATCH],
    ['<=', TOKEN_LESS_THAN_EQUALS],
    ['>=', TOKEN_GREATER_THAN_EQUALS],
    ['??', TOKEN_NULLISH_COALESCING]
]);

// Single character tokens
const SINGLE_CHAR_TOKENS = new Map([
    ['@', TOKEN_AT],
    ['#', TOKEN_HASH],
    ['.', TOKEN_DOT],
    ['|', TOKEN_PIPE],
    ['=', TOKEN_EQUALS],
    ['<', TOKEN_LESS_THAN],
    ['>', TOKEN_GREATER_THAN],
    ['+', TOKEN_PLUS],
    ['-', TOKEN_MINUS],
    ['*', TOKEN_MULTIPLY],
    ['/', TOKEN_DIVIDE],
    ['%', TOKEN_MODULO],
    ['?', TOKEN_QUESTION],
    ['(', TOKEN_OPEN_PAREN],
    [')', TOKEN_CLOSE_PAREN],
    ['[', TOKEN_OPEN_BRACKET],
    [']', TOKEN_CLOSE_BRACKET],
    ['{', TOKEN_OPEN_BRACE],
    ['}', TOKEN_CLOSE_BRACE],
    [',', TOKEN_COMMA],
    [':', TOKEN_COLON],
    [';', TOKEN_SEMICOLON]
]);

// Bracket balance mappings
const OPEN_BRACKET_MAP = new Map([
    [TOKEN_OPEN_PAREN, TOKEN_CLOSE_PAREN],
    [TOKEN_DOT_OPEN_PAREN, TOKEN_CLOSE_PAREN],
    [TOKEN_DOT_DOT_OPEN_PAREN, TOKEN_CLOSE_PAREN],
    [TOKEN_METHOD_OPEN, TOKEN_CLOSE_PAREN],
    [TOKEN_$METHOD_OPEN, TOKEN_CLOSE_PAREN],
    [TOKEN_OPEN_BRACKET, TOKEN_CLOSE_BRACKET],
    [TOKEN_DOT_OPEN_BRACKET, TOKEN_CLOSE_BRACKET],
    [TOKEN_OPEN_BRACE, TOKEN_CLOSE_BRACE],
    [TOKEN_TPL_START, TOKEN_TPL_END]
]);

const CLOSE_BRACKET_SET = new Set([TOKEN_CLOSE_PAREN, TOKEN_CLOSE_BRACKET, TOKEN_CLOSE_BRACE, TOKEN_TPL_END]);

// Helper functions for character classification

function isDigit(code) {
    return code >= 48 && code <= 57; // 0-9
}

function isUpperLetter(code) {
    return code >= 65 && code <= 90; // A-Z
}

function isLowerLetter(code) {
    return code >= 97 && code <= 122; // a-z
}

function isLetter(code) {
    return isUpperLetter(code) || isLowerLetter(code);
}

function isHexDigit(code) {
    return isDigit(code) ||
           (code >= 65 && code <= 70) ||  // A-F
           (code >= 97 && code <= 102);   // a-f
}

// Helper to scan hex digits from a string starting at offset
function scanHex(str, offset, max) {
    let count = 0;
    while (count < max && offset + count < str.length) {
        if (!isHexDigit(str.charCodeAt(offset + count))) {
            break;
        }
        count++;
    }
    return count;
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
        // Simple boolean flags for single-token state (like jison/bison behavior)
        this.preventPrimitive = false;
        this.preventKeyword = false;

        // Tolerant mode support
        this.tolerantMode = tolerantMode;
        this.prevToken = null;
        this.prevTokenEnd = 0;
    }

    // Optimized bracket balance tracking
    trackBracketBalance(tokenType) {
        if (CLOSE_BRACKET_SET.has(tokenType)) {
            this.bracketStack.pop();
        }

        if (OPEN_BRACKET_MAP.has(tokenType)) {
            this.bracketStack.push(OPEN_BRACKET_MAP.get(tokenType));
        }
    }

    // Check if we need to insert an empty IDENT in tolerant mode
    shouldInsertEmptyIdent(nextTokenType) {
        if (!this.tolerantMode) {
            return false;
        }

        return TOLERANT_TOKEN_PAIRS.has(this.prevToken) &&
               TOLERANT_TOKEN_PAIRS.get(this.prevToken).has(nextTokenType);
    }

    // Check if an identifier value should be treated as a keyword for tolerant mode purposes
    isKeywordLikeIdent(tokenType, tokenValue) {
        return tokenType === TOKEN_IDENT && KEYWORDS.has(tokenValue);
    }

    // Optimized character access (avoid method calls)
    peekChar(offset = 0) {
        const index = this.pos + offset;
        return index < this.length ? this.input[index] : '';
    }

    // Optimized advance
    advance(count = 1) {
        this.pos = Math.min(this.pos + count, this.length);
    }

    // Optimized whitespace skipping
    skipWhitespace() {
        const input = this.input;
        const length = this.length;
        let pos = this.pos;

        while (pos < length) {
            const ch = input[pos];
            if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
                pos++;
            } else {
                break;
            }
        }

        this.pos = pos;
    }

    // Optimized comment skipping
    skipComments() {
        const input = this.input;
        const length = this.length;
        let pos = this.pos;

        // Line comments: //
        if (pos < length - 1 && input[pos] === '/' && input[pos + 1] === '/') {
            pos += 2;
            while (pos < length && input[pos] !== '\n' && input[pos] !== '\r') {
                pos++;
            }
            this.pos = pos;
            return true;
        }

        // Block comments: /* */
        if (pos < length - 1 && input[pos] === '/' && input[pos + 1] === '*') {
            pos += 2;
            while (pos < length - 1) {
                if (input[pos] === '*' && input[pos + 1] === '/') {
                    this.pos = pos + 2;
                    return true;
                }
                pos++;
            }
            // Handle unclosed block comment - consume rest of input (like legacy parser)
            this.pos = length;
            return true;
        }

        return false;
    }

    // Optimized string matching
    matchString(str) {
        const strLen = str.length;
        if (this.pos + strLen > this.length) {
            return false;
        }

        for (let i = 0; i < strLen; i++) {
            if (this.input[this.pos + i] !== str[i]) {
                return false;
            }
        }
        return true;
    }

    // Optimized identifier character checking
    isIdentStart(ch) {
        const code = ch.charCodeAt(0);
        return isLetter(code) ||
               code === 95 ||  // underscore
               (ch === '\\' && this.peekChar(1) === 'u');
    }

    isIdentPart(ch) {
        const code = ch.charCodeAt(0);
        return this.isIdentStart(ch) ||
               isDigit(code);
    }

    // Optimized word boundary check
    isWordBoundary(offset = 0) {
        const ch = this.peekChar(offset);
        if (!ch) {
            return true;
        }

        const code = ch.charCodeAt(0);
        return !(isLetter(code) ||
                 isDigit(code) ||
                 code === 95 ||  // underscore
                 code === 36);   // dollar sign
    }

    // Optimized Unicode escape reading
    readUnicodeEscape() {
        if (this.peekChar() === '\\' && this.peekChar(1) === 'u') {
            this.advance(2);
            let hex = '';
            for (let i = 0; i < 4; i++) {
                const ch = this.peekChar();
                const code = ch.charCodeAt(0);
                if (isHexDigit(code)) {
                    hex += ch;
                    this.advance();
                } else {
                    throw new Error(`Invalid Unicode escape sequence at position ${this.pos}`);
                }
            }
            return String.fromCharCode(parseInt(hex, 16));
        }
        return null;
    }

    // Validate escape sequences in strings and templates
    validateEscapeSequence(escapeChar, pos, input) {
        // Validate Unicode escape sequences \uXXXX
        if (escapeChar === 'u') {
            const hexCount = scanHex(input, pos + 1, 4);
            if (hexCount < 4) {
                throw new Error('Invalid Unicode escape sequence');
            }
            return 4; // Number of hex digits to skip
        } else if (escapeChar === 'x') {
            // Validate hexadecimal escape sequences \xXX
            const hexCount = scanHex(input, pos + 1, 2);
            if (hexCount < 2) {
                throw new Error('Invalid hexadecimal escape sequence');
            }
            return 2; // Number of hex digits to skip
        }
        return 0; // No special handling needed
    }

    // Optimized number reading
    readNumber() {
        const start = this.pos;
        const input = this.input;
        let pos = this.pos;

        // Hex numbers: 0x or 0X
        if (pos < this.length - 1 && input[pos] === '0' && (input[pos + 1] === 'x' || input[pos + 1] === 'X')) {
            pos += 2;
            while (pos < this.length) {
                const code = input.charCodeAt(pos);
                if (isHexDigit(code) || code === 95) {  // underscore
                    pos++;
                } else {
                    break;
                }
            }
        } else {
            // Regular numbers (including underscores and decimals)
            let hasDecimalPoint = false;

            while (pos < this.length) {
                const code = input.charCodeAt(pos);
                if (isDigit(code) || code === 95) {  // digit or underscore
                    pos++;
                } else if (input[pos] === '.' && !hasDecimalPoint) {
                    // Only consume dot if followed by a digit (valid decimal)
                    if (pos + 1 < this.length && isDigit(input.charCodeAt(pos + 1))) {
                        hasDecimalPoint = true;
                        pos++;
                    } else {
                        // Dot not followed by digit, stop here
                        break;
                    }
                } else {
                    break;
                }
            }

            // Scientific notation
            if (pos < this.length && (input[pos] === 'e' || input[pos] === 'E')) {
                pos++;
                if (pos < this.length && (input[pos] === '+' || input[pos] === '-')) {
                    pos++;
                }
                while (pos < this.length) {
                    const code = input.charCodeAt(pos);
                    if (isDigit(code) || code === 95) {  // underscore
                        pos++;
                    } else {
                        break;
                    }
                }
            }
        }

        this.pos = pos;
        const rawValue = input.slice(start, pos);

        // Convert to actual number value using the same logic as legacy
        const convertedValue = this.toNumberLiteral(rawValue);

        this.preventPrimitive = true; // Set state for next token
        return new Token(TOKEN_NUMBER, convertedValue, start);
    }

    // Optimized string reading
    readString(quote) {
        const start = this.pos;
        const input = this.input;
        const length = this.length;
        let pos = this.pos + 1; // Skip opening quote

        // Read until closing quote or end, validating escape sequences
        for (; pos < length && input[pos] !== quote; pos++) {
            const char = input[pos];

            if (char === '\\') {
                pos++; // Skip the escape character
            }
        }

        // Ensure we found a closing quote
        if (pos < length) {
            pos++; // Skip closing quote
        }

        this.pos = pos;
        this.preventPrimitive = true; // Set state for next token
        const rawValue = input.slice(start, pos);

        // Convert to actual string value using the same logic as legacy
        const convertedValue = this.toStringLiteral(rawValue);

        return new Token(TOKEN_STRING, convertedValue, start);
    }

    readTemplate() {
        const start = this.pos;
        const origPos = this.pos;

        // Determine if this is a simple template or start of complex one
        let pos = this.pos + 1; // Skip opening `
        let hasInterpolation = false;

        while (pos < this.length && this.input[pos] !== '`') {
            if (this.input[pos] === '$' && this.input[pos + 1] === '{') {
                hasInterpolation = true;
                break;
            }
            if (this.input[pos] === '\\') {
                pos++; // Skip escape
                if (pos >= this.length) {
                    break;
                }

                const escapeChar = this.input[pos];
                // Validate escape sequences
                const hexSkip = this.validateEscapeSequence(escapeChar, pos, this.input);
                pos += hexSkip;
            }
            pos++;
        }

        if (!hasInterpolation) {
            // Simple template literal - advance to end
            this.pos = pos;
            if (this.pos < this.length) {
                this.advance(); // Skip closing `
            }

            // Process template content like legacy (strip backticks and process escapes)
            const rawValue = this.input.slice(origPos, this.pos);
            const processedValue = this.toStringLiteral(rawValue, true, 1);
            this.preventPrimitive = true; // Set state for next token
            return new Token(TOKEN_TEMPLATE, processedValue, start);
        } else {
            // Template with interpolation - read until ${
            this.advance(); // Skip `
            while (this.pos < this.length && !(this.input[this.pos] === '$' && this.input[this.pos + 1] === '{')) {
                if (this.input[this.pos] === '\\') {
                    this.advance();
                    if (this.pos < this.length) {
                        const escapeChar = this.input[this.pos];
                        // Validate escape sequences
                        const hexSkip = this.validateEscapeSequence(escapeChar, this.pos, this.input);
                        this.advance(hexSkip);
                    }
                }
                this.advance();
            }

            this.advance(2); // Skip ${

            // Process template start like legacy (strip ` and ${ - so end=2)
            const rawValue = this.input.slice(origPos, this.pos);
            const processedValue = this.toStringLiteral(rawValue, true, 2);
            this.trackBracketBalance(TOKEN_TPL_START);
            return new Token(TOKEN_TPL_START, processedValue, start);
        }
    }

    readTemplateEnd() {
        const start = this.pos - 1; // Include the } that triggered this
        const origPos = this.pos - 1; // Start from the }

        while (this.pos < this.length && this.input[this.pos] !== '`') {
            if (this.input[this.pos] === '$' && this.input[this.pos + 1] === '{') {
                // Continue template
                this.advance(2);

                // Process template continue like legacy (strip } and ${ - so end=2)
                const rawValue = this.input.slice(origPos, this.pos);
                const processedValue = this.toStringLiteral(rawValue, true, 2);
                return new Token(TOKEN_TPL_CONTINUE, processedValue, start);
            }
            if (this.input[this.pos] === '\\') {
                this.advance();
                if (this.pos < this.length) {
                    const escapeChar = this.input[this.pos];
                    // Validate escape sequences
                    const hexSkip = this.validateEscapeSequence(escapeChar, this.pos, this.input);
                    this.advance(hexSkip);
                }
            }
            this.advance();
        }

        if (this.pos < this.length) {
            this.advance(); // Skip closing `
        }

        // Process template end like legacy (strip } and ` - so end=1)
        const rawValue = this.input.slice(origPos, this.pos);
        const processedValue = this.toStringLiteral(rawValue, true, 1);
        this.preventPrimitive = true; // Set state for next token
        this.trackBracketBalance(TOKEN_TPL_END);
        return new Token(TOKEN_TPL_END, processedValue, start);
    }

    readRegExp() {
        const start = this.pos;
        const rawStart = this.pos;
        let inCharClass = false;
        this.advance(); // Skip opening /

        while (this.pos < this.length) {
            const ch = this.input[this.pos];

            if (ch === '\\') {
                // Handle escape sequences - advance past both backslash and escaped char
                this.advance();
                if (this.pos < this.length) {
                    this.advance();
                }
            } else if (ch === '[' && !inCharClass) {
                // Start of character class
                inCharClass = true;
                this.advance();
            } else if (ch === ']' && inCharClass) {
                // End of character class
                inCharClass = false;
                this.advance();
            } else if (ch === '/' && !inCharClass) {
                // End of regex (only if not inside character class)
                break;
            } else {
                this.advance();
            }
        }

        if (this.pos < this.length) {
            this.advance(); // Skip closing /
        }

        // Read flags and validate for duplicates
        const seenFlags = new Set();

        while (this.pos < this.length && /[gimsu]/.test(this.input[this.pos])) {
            const flag = this.input[this.pos];
            if (seenFlags.has(flag)) {
                throw new Error('Duplicate flag in regexp');
            }
            seenFlags.add(flag);
            this.advance();
        }

        // Store the raw string value including delimiters and flags
        const rawValue = this.input.slice(rawStart, this.pos);

        // Convert to actual RegExp object using the same logic as legacy
        const convertedValue = this.toRegExp(rawValue);

        return new Token(TOKEN_REGEXP, convertedValue, start);
    }

    // Optimized identifier reading
    readIdentifier() {
        const input = this.input;
        const length = this.length;
        let value = '';
        let pos = this.pos;

        while (pos < length && this.isIdentPart(input[pos])) {
            if (input[pos] === '\\' && pos + 1 < length && input[pos + 1] === 'u') {
                // Store the raw unicode escape sequence
                value += '\\u';
                pos += 2;
                const hexCount = scanHex(input, pos, 4);
                if (hexCount < 4) {
                    throw new Error(`Invalid Unicode escape sequence at position ${pos}`);
                }
                for (let i = 0; i < 4; i++) {
                    value += input[pos];
                    pos++;
                }
            } else {
                value += input[pos];
                pos++;
            }
        }

        this.pos = pos;
        return value;
    }

    // Optimized keyword sequence reading
    readKeywordSequence() {
        const savedPos = this.pos;

        // Try to match multi-word keywords
        if (this.matchString('has')) {
            this.advance(3);
            if (!this.isWordBoundary()) {
                this.pos = savedPos;
                return null;
            }

            // Look ahead for 'no' after whitespace
            const tempPos = this.pos;
            this.skipWhitespace();
            if (this.matchString('no') && this.isWordBoundary(2)) {
                this.advance(2);
                return new Token(TOKEN_HASNO, 'has no', savedPos);
            }
            this.pos = tempPos; // Restore if 'no' not found
            return new Token(TOKEN_HAS, 'has', savedPos);
        }

        if (this.matchString('not')) {
            this.advance(3);
            if (!this.isWordBoundary()) {
                this.pos = savedPos;
                return null;
            }

            // Look ahead for 'in' after whitespace
            const tempPos = this.pos;
            this.skipWhitespace();
            if (this.matchString('in') && this.isWordBoundary(2)) {
                this.advance(2);
                return new Token(TOKEN_NOTIN, 'not in', savedPos);
            }
            this.pos = tempPos; // Restore if 'in' not found
            return new Token(TOKEN_NOT, 'not', savedPos);
        }

        return null;
    }

    // Optimized main tokenization method
    nextToken() {
        return this.tolerantMode
            ? this.nextTokenTolerant()
            : this.nextTokenStrict();
    }

    // Tolerant mode tokenization wrapper
    nextTokenTolerant() {
        // If there's a pending token from a previous empty IDENT insertion, return it directly
        if (this.hasPendingToken()) {
            return this.getPendingToken();
        }

        const token = this.nextTokenStrict();

        // Check if we need to insert an empty IDENT before this token
        // Handle keyword-like identifiers specially in tolerant mode
        let effectiveTokenType = token.type;
        let actualToken = token;

        if (this.isKeywordLikeIdent(token.type, token.value)) {
            effectiveTokenType = KEYWORDS.get(token.value);
            // If this would trigger empty IDENT insertion, reprocess as keyword
            if (this.shouldInsertEmptyIdent(effectiveTokenType)) {
                actualToken = new Token(effectiveTokenType, token.value, token.offset);
            }
        }

        if (this.shouldInsertEmptyIdent(effectiveTokenType)) {
            // Save current token state
            const currentPos = this.pos;

            // Create empty IDENT token at the position where the previous token ended
            const emptyIdent = new Token(TOKEN_IDENT, '', this.prevTokenEnd);

            // Set up to return the actual token (possibly converted to keyword) on next call
            this.pendingToken = actualToken;
            this.pos = currentPos;

            // Update previous token tracking for empty ident
            this.prevToken = TOKEN_IDENT;
            this.prevTokenEnd = this.prevTokenEnd; // empty token doesn't advance position

            // Reset preventKeyword state since we're inserting an identifier
            this.preventKeyword = false;

            return emptyIdent;
        }

        // Normal token processing
        this.updatePreviousToken(token);
        return token;
    }

    // Check for pending token from tolerant mode
    hasPendingToken() {
        return this.pendingToken !== undefined;
    }

    // Get and clear pending token
    getPendingToken() {
        const token = this.pendingToken;
        this.pendingToken = undefined;
        this.updatePreviousToken(token);
        return token;
    }

    // Update previous token tracking
    updatePreviousToken(token) {
        this.prevToken = token.type;
        this.prevTokenEnd = this.pos;
    }

    // Strict mode tokenization (original logic)
    nextTokenStrict() {
        // Check for pending token first
        if (this.hasPendingToken()) {
            return this.getPendingToken();
        }

        // Skip whitespace and comments first
        do {
            this.skipWhitespace();
        } while (this.skipComments());

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

        // Handle template continuation/end using bracket stack
        if (this.bracketStack.length > 0 && ch === '}') {
            // Check if this } would close a template expression
            const expectedClose = this.bracketStack[this.bracketStack.length - 1];
            if (expectedClose === TOKEN_TPL_END) {
                // This } closes a template expression
                this.advance();
                return this.readTemplateEnd();
            }
            // Otherwise, it's a regular } token - let normal processing handle it
        }

        // Numbers (optimized character code check)
        const charCode = ch.charCodeAt(0);
        if (isDigit(charCode) ||
            (ch === '0' && this.pos < this.length - 1 && (input[this.pos + 1] === 'x' || input[this.pos + 1] === 'X')) ||
            (ch === '.' && this.pos < this.length - 1 && (isDigit(input.charCodeAt(this.pos + 1)) || input[this.pos + 1] === '_'))) {
            return this.readNumber();
        }

        // Strings
        if (ch === '"' || ch === "'") {
            return this.readString(ch);
        }

        // Template literals
        if (ch === '`') {
            return this.readTemplate();
        }

        // Regular expressions (context-aware using state)
        if (ch === '/') {
            // If preventPrimitive state is active, treat as division
            if (preventPrimitive) {
                this.advance();
                return new Token(TOKEN_DIVIDE, '/', start);
            } else {
                // In tolerant mode, check if this looks like a division context
                // by checking if we would insert empty identifiers AND
                // the content doesn't look like a regex pattern
                if (this.shouldInsertEmptyIdent(TOKEN_DIVIDE)) {
                    // Peek ahead to see if this looks like a regex pattern
                    // Simple heuristic: if the next char after '/' is alphanumeric, it might be regex
                    const nextChar = this.peekChar(1);
                    const looksLikeRegex = nextChar && /[a-zA-Z0-9]/.test(nextChar);

                    if (!looksLikeRegex) {
                        // Treat as division if it doesn't look like regex
                        this.advance();
                        return new Token(TOKEN_DIVIDE, '/', start);
                    }
                }

                // Otherwise treat as regex and set preventPrimitive for next token
                this.preventPrimitive = true; // Set state for next token
                return this.readRegExp();
            }
        }

        // Keywords (must be before identifiers, unless preventKeyword is active)
        if (!preventKeyword) {
            const keyword = this.readKeywordSequence();
            if (keyword) {
                return keyword;
            }
        }

        // Identifiers and method calls
        if (this.isIdentStart(ch)) {
            const value = this.readIdentifier();

            // Check for literals using Map lookup
            if (!preventKeyword && LITERALS.has(value)) {
                this.preventPrimitive = true; // Set state for next token
                // Convert literal to actual value
                const convertedValue = LITERALS.get(value);
                return new Token(TOKEN_LITERAL, convertedValue, start);
            }

            // Check for single-word keywords using Map lookup (unless preventKeyword is active)
            if (!preventKeyword && KEYWORDS.has(value)) {
                return new Token(KEYWORDS.get(value), value, start);
            }

            // Check for order keywords
            if (!preventKeyword && ORDER_RE.test(value)) {
                return new Token(TOKEN_ORDER, value, start);
            }

            // Check for method call
            if (this.pos < this.length && input[this.pos] === '(') {
                this.advance(); // consume the (
                this.trackBracketBalance(TOKEN_METHOD_OPEN);
                return new Token(TOKEN_METHOD_OPEN, value + '(', start);
            }

            this.preventPrimitive = true; // Set state for next token
            return new Token(TOKEN_IDENT, value, start);
        }

        // Variable references and special symbols
        if (ch === '$') {
            if (this.pos < this.length - 1 && input[this.pos + 1] === '$') {
                this.preventPrimitive = true; // Set state for next token
                this.advance(2);
                return new Token(TOKEN_$$, '$$', start);
            } else if (this.pos < this.length - 1 && input[this.pos + 1] === '{') {
                // Template expression start - this will be handled by template reading
                // Continue with normal $ handling
            }

            if (this.pos < this.length - 1 &&
                (this.isIdentStart(input[this.pos + 1]) ||
                 (input[this.pos + 1] === '\\' && this.pos < this.length - 2 && input[this.pos + 2] === 'u'))) {
                this.advance();
                const value = this.readIdentifier();

                // Check for $method(
                if (this.pos < this.length && input[this.pos] === '(') {
                    this.advance(); // consume the (
                    this.trackBracketBalance(TOKEN_$METHOD_OPEN);
                    return new Token(TOKEN_$METHOD_OPEN, '$' + value + '(', start);
                }

                this.preventPrimitive = true; // Set state for next token
                return new Token(TOKEN_$IDENT, '$' + value, start);
            } else {
                this.advance();
                this.preventPrimitive = true; // Set state for next token
                return new Token(TOKEN_$, '$', start);
            }
        }

        // Multi-character operators (check longest first)
        if (this.pos <= this.length - 3) {
            const threeChar = input.slice(this.pos, this.pos + 3);
            if (threeChar === '...') {
                this.advance(3);
                return new Token(TOKEN_DOT_DOT_DOT, '...', start);
            }
            if (threeChar === '..(') {
                this.advance(3);
                return new Token(TOKEN_DOT_DOT_OPEN_PAREN, '..(', start);
            }
        }

        // Two-character operators using Map lookup
        if (this.pos < this.length - 1) {
            const twoChar = input.slice(this.pos, this.pos + 2);
            if (TWO_CHAR_OPERATORS.has(twoChar)) {
                this.advance(2);
                const tokenType = TWO_CHAR_OPERATORS.get(twoChar);

                // Set preventKeyword state for DOT_DOT tokens
                this.preventKeyword = tokenType === TOKEN_DOT_DOT;

                // Track bracket balance for relevant tokens
                this.trackBracketBalance(tokenType);
                return new Token(tokenType, twoChar, start);
            }
        }

        // Single character tokens using Map lookup
        if (SINGLE_CHAR_TOKENS.has(ch)) {
            this.advance();
            const tokenType = SINGLE_CHAR_TOKENS.get(ch);

            // Set preventPrimitive state for tokens that should trigger it
            if (tokenType === TOKEN_AT || tokenType === TOKEN_HASH ||
                tokenType === TOKEN_CLOSE_PAREN || tokenType === TOKEN_CLOSE_BRACKET ||
                tokenType === TOKEN_CLOSE_BRACE) {
                this.preventPrimitive = true;
            }

            // Configure state for DOT tokens (property access)
            if (tokenType === TOKEN_DOT) {
                this.preventPrimitive = true;
                // Note: preventKeyword is NOT set for TOKEN_DOT to allow keyword recognition
                // This enables compound keywords like ". has no" and ". not in" to work correctly
                // while single keywords follow the tolerant token pair rules
            }

            // Track bracket balance for bracket tokens
            this.trackBracketBalance(tokenType);
            return new Token(tokenType, ch, start);
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
        const lineTerminator = new Set(['\n', '\r', '\u2028', '\u2029']);
        const valueEnd = value.length - end;
        let result = '';

        for (let i = 1; i < valueEnd; i++) {
            if (!multiline && lineTerminator.has(value[i])) {
                throw new Error('Invalid line terminator');
            }

            if (value[i] !== '\\') {
                result += value[i];
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
        const flagsIndex = value.lastIndexOf('/') + 1;
        const flags = value.substr(flagsIndex);

        flags.split('').forEach((flag, idx, array) => {
            const duplicateIndex = array.indexOf(flag, idx + 1);
            if (duplicateIndex !== -1) {
                throw new Error('Duplicate flag in regexp');
            }
        });

        return new RegExp(
            value.substr(1, value.lastIndexOf('/') - 1),
            flags
        );
    }

    // State management methods for parser backtracking
    saveState() {
        return {
            pos: this.pos,
            bracketStack: [...this.bracketStack],
            preventPrimitive: this.preventPrimitive,
            preventKeyword: this.preventKeyword,
            prevToken: this.prevToken,
            prevTokenEnd: this.prevTokenEnd,
            pendingToken: this.pendingToken
        };
    }

    restoreState(state) {
        this.pos = state.pos;
        this.bracketStack = state.bracketStack;
        this.preventPrimitive = state.preventPrimitive;
        this.preventKeyword = state.preventKeyword;
        this.prevToken = state.prevToken;
        this.prevTokenEnd = state.prevTokenEnd;
        this.pendingToken = state.pendingToken;
    }
}
