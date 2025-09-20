
// Core token types (following grammar.cjs)
export const TokenType = {
    // Literals
    NUMBER: 'NUMBER',
    STRING: 'STRING',
    REGEXP: 'REGEXP',
    LITERAL: 'LITERAL',
    IDENT: 'IDENT',
    '$IDENT': '$IDENT',

    // Special references
    '@': '@',           // DATA
    '#': '#',           // CONTEXT
    '$': '$',           // CURRENT
    '$$': '$$',         // ARG1

    // Keywords
    AND: 'AND',
    OR: 'OR',
    NOT: 'NOT',
    NO: 'NO',
    IS: 'IS',
    IN: 'IN',
    NOTIN: 'NOTIN',
    HAS: 'HAS',
    HASNO: 'HASNO',
    ORDER: 'ORDER',

    // Method calls
    'METHOD(': 'METHOD(',
    '$METHOD(': '$METHOD(',

    // Template tokens
    TEMPLATE: 'TEMPLATE',
    TPL_START: 'TPL_START',
    TPL_CONTINUE: 'TPL_CONTINUE',
    TPL_END: 'TPL_END',

    // Operators
    '.': '.',
    '..': '..',
    '...': '...',
    '.(': '.(',
    '.[': '.[',
    '..(': '..(',
    '|': '|',
    '=>': '=>',
    '=': '=',
    '!=': '!=',
    '~=': '~=',
    '<': '<',
    '<=': '<=',
    '>': '>',
    '>=': '>=',
    '+': '+',
    '-': '-',
    '*': '*',
    '/': '/',
    '%': '%',
    '??': '??',
    '?': '?',

    // Punctuation
    '(': '(',
    ')': ')',
    '[': '[',
    ']': ']',
    '{': '{',
    '}': '}',
    ',': ',',
    ':': ':',
    ';': ';',

    // Special
    EOF: 'EOF'
};

export class Token {
    constructor(type, value, offset = 0) {
        this.type = type;
        this.value = value;
        this.offset = offset;
    }
}

export class Tokenizer {
    constructor(input) {
        this.input = input;
        this.pos = 0;
        this.length = input.length;
        this.templateStack = [];
        this.bracketStack = []; // Track bracket balance like the legacy parser

        // Bracket balance mapping (from parse-patch.cjs)
        this.openBalance = new Map([
            ['(', ')'],
            ['.(', ')'],
            ['..(', ')'],
            ['METHOD(', ')'],
            ['$METHOD(', ')'],
            ['[', ']'],
            ['.[', ']'],
            ['{', '}'],
            ['TPL_START', 'TPL_END']
        ]);
        this.closeBalance = new Set([')', ']', '}', 'TPL_END']);
    }

    // Track bracket balance like the legacy parser
    trackBracketBalance(token) {
        if (this.closeBalance.has(token.type)) {
            const expected = this.bracketStack.pop();
            // Note: We don't throw errors here like the parser does, just track balance
        }

        if (this.openBalance.has(token.type)) {
            this.bracketStack.push(this.openBalance.get(token.type));
        }

        return token;
    }

    peek(offset = 0) {
        return this.input[this.pos + offset] || '';
    }

    advance(count = 1) {
        this.pos = Math.min(this.pos + count, this.length);
    }

    skipWhitespace() {
        while (this.pos < this.length && /\s/.test(this.input[this.pos])) {
            this.pos++;
        }
    }

    skipComments() {
        // Line comments: //
        if (this.peek() === '/' && this.peek(1) === '/') {
            while (this.pos < this.length && this.peek() !== '\n' && this.peek() !== '\r') {
                this.advance();
            }
            return true;
        }

        // Block comments: /* */
        if (this.peek() === '/' && this.peek(1) === '*') {
            this.advance(2);
            while (this.pos < this.length - 1) {
                if (this.peek() === '*' && this.peek(1) === '/') {
                    this.advance(2);
                    return true;
                }
                this.advance();
            }
        }

        return false;
    }

    match(str) {
        return this.input.slice(this.pos, this.pos + str.length) === str;
    }

    isIdentStart(ch) {
        return /[a-zA-Z_]/.test(ch) || (ch === '\\' && this.peek(1) === 'u');
    }

    isIdentPart(ch) {
        return /[a-zA-Z_$0-9]/.test(ch) || (ch === '\\' && this.peek(1) === 'u');
    }

    readUnicodeEscape() {
        if (this.peek() === '\\' && this.peek(1) === 'u') {
            this.advance(2);
            let hex = '';
            for (let i = 0; i < 4; i++) {
                if (/[0-9a-fA-F]/.test(this.peek())) {
                    hex += this.peek();
                    this.advance();
                } else {
                    throw new Error(`Invalid Unicode escape sequence at position ${this.pos}`);
                }
            }
            return String.fromCharCode(parseInt(hex, 16));
        }
        return null;
    }

    readNumber() {
        const start = this.pos;

        // Read the raw number including underscores, exponents, hex, etc.
        const origPos = this.pos;

        // Hex numbers: 0x or 0X
        if (this.match('0x') || this.match('0X')) {
            this.advance(2);
            while (this.pos < this.length) {
                const ch = this.peek();
                if (/[0-9a-fA-F_]/.test(ch)) {
                    this.advance();
                } else {
                    break;
                }
            }
        } else {
            // Regular numbers (including underscores and scientific notation)
            while (this.pos < this.length) {
                const ch = this.peek();
                if (/[0-9._]/.test(ch)) {
                    this.advance();
                } else {
                    break;
                }
            }

            // Scientific notation
            if (this.peek() === 'e' || this.peek() === 'E') {
                this.advance();
                if (this.peek() === '+' || this.peek() === '-') {
                    this.advance();
                }
                while (this.pos < this.length) {
                    const ch = this.peek();
                    if (/[0-9_]/.test(ch)) {
                        this.advance();
                    } else {
                        break;
                    }
                }
            }
        }

        // Return the raw number string (like legacy tokenizer)
        const rawValue = this.input.slice(origPos, this.pos);
        return new Token(TokenType.NUMBER, rawValue, start);
    }

    readString(quote) {
        const start = this.pos;
        const origPos = this.pos;
        this.advance(); // Skip opening quote

        // Read until closing quote or end, including escaped characters
        while (this.pos < this.length && this.input[this.pos] !== quote) {
            if (this.input[this.pos] === '\\') {
                this.advance(); // Skip escape character
                if (this.pos < this.length) {
                    this.advance(); // Skip escaped character
                }
            } else {
                this.advance();
            }
        }

        if (this.pos < this.length) {
            this.advance(); // Skip closing quote
        }

        // Return the raw string including quotes (like legacy tokenizer)
        const rawValue = this.input.slice(origPos, this.pos);
        return new Token(TokenType.STRING, rawValue, start);
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
            }
            pos++;
        }

        if (!hasInterpolation) {
            // Simple template literal - advance to end
            this.pos = pos;
            if (this.pos < this.length) {
                this.advance(); // Skip closing `
            }

            // Return raw template including backticks (like legacy)
            const rawValue = this.input.slice(origPos, this.pos);
            return new Token(TokenType.TEMPLATE, rawValue, start);
        } else {
            // Template with interpolation - read until ${
            this.advance(); // Skip `
            while (this.pos < this.length && !(this.input[this.pos] === '$' && this.input[this.pos + 1] === '{')) {
                if (this.input[this.pos] === '\\') {
                    this.advance();
                }
                this.advance();
            }

            this.advance(2); // Skip ${
            this.templateStack.push('template');

            // Return raw value including delimiters (like legacy: "`temp${")
            const rawValue = this.input.slice(origPos, this.pos);
            const token = new Token(TokenType.TPL_START, rawValue, start);
            return this.trackBracketBalance(token);
        }
    }

    readTemplateEnd() {
        const start = this.pos - 1; // Include the } that triggered this
        const origPos = this.pos - 1; // Start from the }

        while (this.pos < this.length && this.input[this.pos] !== '`') {
            if (this.input[this.pos] === '$' && this.input[this.pos + 1] === '{') {
                // Continue template
                this.advance(2);

                // Return raw value including delimiters (like legacy: "}more${")
                const rawValue = this.input.slice(origPos, this.pos);
                return new Token(TokenType.TPL_CONTINUE, rawValue, start);
            }
            if (this.input[this.pos] === '\\') {
                this.advance();
            }
            this.advance();
        }

        if (this.pos < this.length) {
            this.advance(); // Skip closing `
        }

        this.templateStack.pop();

        // Return raw value including delimiters (like legacy: "}late`")
        const rawValue = this.input.slice(origPos, this.pos);
        return new Token(TokenType.TPL_END, rawValue, start);
    }

    readRegExp() {
        const start = this.pos;
        const rawStart = this.pos;
        this.advance(); // Skip opening /

        while (this.pos < this.length && this.input[this.pos] !== '/') {
            if (this.input[this.pos] === '\\') {
                this.advance();
                if (this.pos < this.length) {
                    this.advance();
                }
            } else {
                this.advance();
            }
        }

        if (this.pos < this.length) {
            this.advance(); // Skip closing /
        }

        // Read flags
        while (this.pos < this.length && /[gimsu]/.test(this.input[this.pos])) {
            this.advance();
        }

        // Store the raw string value including delimiters and flags
        const rawValue = this.input.slice(rawStart, this.pos);
        return new Token(TokenType.REGEXP, rawValue, start);
    }

    readIdentifier() {
        const start = this.pos;
        let value = '';

        while (this.pos < this.length && this.isIdentPart(this.peek())) {
            if (this.peek() === '\\' && this.peek(1) === 'u') {
                // Store the raw unicode escape sequence
                value += '\\u';
                this.advance(2);
                for (let i = 0; i < 4; i++) {
                    if (/[0-9a-fA-F]/.test(this.peek())) {
                        value += this.peek();
                        this.advance();
                    } else {
                        throw new Error(`Invalid Unicode escape sequence at position ${this.pos}`);
                    }
                }
            } else {
                value += this.peek();
                this.advance();
            }
        }

        return value;
    }

    readKeywordSequence() {
        const savedPos = this.pos;

        // Try to match multi-word keywords
        if (this.match('has')) {
            this.advance(3);
            if (!this.isWordBoundary()) {
                this.pos = savedPos;
                return null;
            }

            // Look ahead for 'no' after whitespace
            const tempPos = this.pos;
            this.skipWhitespace();
            if (this.match('no') && this.isWordBoundary(2)) {
                this.advance(2);
                return new Token(TokenType.HASNO, 'has no', savedPos);
            }
            this.pos = tempPos; // Restore if 'no' not found
            return new Token(TokenType.HAS, 'has', savedPos);
        }

        if (this.match('not')) {
            this.advance(3);
            if (!this.isWordBoundary()) {
                this.pos = savedPos;
                return null;
            }

            // Look ahead for 'in' after whitespace
            const tempPos = this.pos;
            this.skipWhitespace();
            if (this.match('in') && this.isWordBoundary(2)) {
                this.advance(2);
                return new Token(TokenType.NOTIN, 'not in', savedPos);
            }
            this.pos = tempPos; // Restore if 'in' not found
            return new Token(TokenType.NOT, 'not', savedPos);
        }

        return null;
    }

    isWordBoundary(offset = 0) {
        const ch = this.peek(offset);
        return !ch || !/[a-zA-Z_$0-9]/.test(ch);
    }

    nextToken() {
        // Skip whitespace and comments
        do {
            this.skipWhitespace();
        } while (this.skipComments());

        if (this.pos >= this.length) {
            return new Token(TokenType.EOF, '', this.pos);
        }

        const ch = this.input[this.pos];
        const start = this.pos;

        // Handle template continuation/end using bracket stack
        if (this.templateStack.length > 0 && ch === '}') {
            // Check if this } would close a template expression
            const expectedClose = this.bracketStack[this.bracketStack.length - 1];
            if (expectedClose === 'TPL_END') {
                // This } closes a template expression
                this.advance();
                return this.trackBracketBalance(this.readTemplateEnd());
            }
            // Otherwise, it's a regular } token - let normal processing handle it
        }        // Numbers
        if (/[0-9]/.test(ch) || (ch === '0' && (this.peek(1) === 'x' || this.peek(1) === 'X'))) {
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

        // Regular expressions
        if (ch === '/' && this.peek(1) !== '/' && this.peek(1) !== '*' && this.peek(1) !== '=') {
            return this.readRegExp();
        }

        // Keywords (must be before identifiers)
        const keyword = this.readKeywordSequence();
        if (keyword) {
            return keyword;
        }

        // Identifiers and method calls
        if (this.isIdentStart(ch)) {
            const value = this.readIdentifier();

            // Check for literals
            const literals = {
                'true': true,
                'false': false,
                'null': null,
                'undefined': undefined,
                'Infinity': Infinity,
                'NaN': NaN
            };

            if (literals.hasOwnProperty(value)) {
                return new Token(TokenType.LITERAL, value, start);
            }

            // Check for single-word keywords that weren't caught by readKeywordSequence
            const singleKeywords = {
                'and': TokenType.AND,
                'or': TokenType.OR,
                'is': TokenType.IS,
                'in': TokenType.IN,
                'no': TokenType.NO
            };

            if (singleKeywords.hasOwnProperty(value)) {
                return new Token(singleKeywords[value], value, start);
            }

            // Check for order keywords
            if (/^(asc|desc)(NA?|AN?)?$/.test(value)) {
                return new Token(TokenType.ORDER, value, start);
            }

            // Check for method call
            if (this.peek() === '(') {
                // Include the opening parenthesis like legacy tokenizer
                this.advance(); // consume the (
                const token = new Token('METHOD(', value + '(', start);
                return this.trackBracketBalance(token);
            }

            return new Token(TokenType.IDENT, value, start);
        }

        // Variable references and special symbols
        if (ch === '$') {
            if (this.peek(1) === '$') {
                this.advance(2);
                return new Token(TokenType.$$, '$$', start);
            } else if (this.peek(1) === '{') {
                // Template expression start - this will be handled by template reading
                // Continue with normal $ handling
            }

            if (this.isIdentStart(this.peek(1)) || (this.peek(1) === '\\' && this.peek(2) === 'u')) {
                this.advance();
                const value = this.readIdentifier();

                // Check for $method(
                if (this.peek() === '(') {
                    this.advance(); // consume the (
                    const token = new Token('$METHOD(', '$' + value + '(', start);
                    return this.trackBracketBalance(token);
                }

                return new Token('$IDENT', '$' + value, start);
            } else {
                this.advance();
                return new Token(TokenType.$, '$', start);
            }
        }

        // Multi-character operators (check longest first)
        const threeChar = this.input.slice(this.pos, this.pos + 3);
        if (threeChar === '...') {
            this.advance(3);
            return new Token(TokenType['...'], '...', start);
        }
        if (threeChar === '..(') {
            this.advance(3);
            return new Token(TokenType['..('], '..(', start);
        }

        const twoChar = this.input.slice(this.pos, this.pos + 2);
        const twoCharTokens = {
            '..': '..',
            '.(': '.(',
            '.[': '.[',
            '=>': '=>',
            '!=': '!=',
            '~=': '~=',
            '<=': '<=',
            '>=': '>=',
            '??': '??'
        };

        if (twoCharTokens[twoChar]) {
            this.advance(2);
            const token = new Token(TokenType[twoChar], twoChar, start);
            // Track bracket balance for relevant tokens
            if (twoChar === '.(' || twoChar === '.[') {
                return this.trackBracketBalance(token);
            }
            return token;
        }

        // Single character tokens
        const singleCharTokens = {
            '@': '@',
            '#': '#',
            '.': '.',
            '|': '|',
            '=': '=',
            '<': '<',
            '>': '>',
            '+': '+',
            '-': '-',
            '*': '*',
            '/': '/',
            '%': '%',
            '?': '?',
            '(': '(',
            ')': ')',
            '[': '[',
            ']': ']',
            '{': '{',
            '}': '}',
            ',': ',',
            ':': ':',
            ';': ';'
        };

        if (singleCharTokens[ch]) {
            this.advance();
            const token = new Token(TokenType[ch], ch, start);
            // Track bracket balance for bracket tokens
            if (ch === '(' || ch === ')' || ch === '[' || ch === ']' || ch === '{' || ch === '}') {
                return this.trackBracketBalance(token);
            }
            return token;
        }

        throw new Error(`Unexpected character '${ch}' at position ${this.pos}`);
    }
}
