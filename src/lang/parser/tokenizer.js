
// Core token types
export const TokenType = {
    // Literals and identifiers
    NUMBER: 'NUMBER',
    STRING: 'STRING',
    REGEXP: 'REGEXP',
    LITERAL: 'LITERAL',
    IDENT: 'IDENT',
    VAR_REF: 'VAR_REF',
    METHOD: 'METHOD',

    // Special references
    DATA: 'DATA',        // @
    CONTEXT: 'CONTEXT',  // #
    CURRENT: 'CURRENT',  // $
    ARG1: 'ARG1',        // $$

    // Keywords
    AND: 'AND',
    OR: 'OR',
    NOT: 'NOT',
    IS: 'IS',
    IN: 'IN',
    HAS: 'HAS',

    // Operators
    DOT: 'DOT',             // .
    DOUBLE_DOT: 'DOUBLE_DOT', // ..
    PIPE: 'PIPE',           // |
    ARROW: 'ARROW',         // =>
    EQ: 'EQ',               // =
    NE: 'NE',               // !=
    MATCH: 'MATCH',         // ~=
    LT: 'LT',               // <
    LE: 'LE',               // <=
    GT: 'GT',               // >
    GE: 'GE',               // >=
    PLUS: 'PLUS',           // +
    MINUS: 'MINUS',         // -
    MULT: 'MULT',           // *
    DIV: 'DIV',             // /
    MOD: 'MOD',             // %
    NULLISH: 'NULLISH',     // ??
    QUESTION: 'QUESTION',   // ?

    // Punctuation
    LPAREN: 'LPAREN',       // (
    RPAREN: 'RPAREN',       // )
    LBRACKET: 'LBRACKET',   // [
    RBRACKET: 'RBRACKET',   // ]
    LBRACE: 'LBRACE',       // {
    RBRACE: 'RBRACE',       // }
    COMMA: 'COMMA',         // ,
    COLON: 'COLON',         // :
    SEMICOLON: 'SEMICOLON', // ;

    // Special
    EOF: 'EOF'
};

// Operator precedence table (higher = higher precedence)
const PRECEDENCE = new Map([
    [TokenType.ARROW, 1],
    [TokenType.PIPE, 2],
    [TokenType.QUESTION, 3],
    [TokenType.IS, 4],
    [TokenType.OR, 5],
    [TokenType.AND, 6],
    [TokenType.NULLISH, 7],
    [TokenType.NOT, 8],
    [TokenType.IN, 9],
    [TokenType.HAS, 9],
    [TokenType.EQ, 10],
    [TokenType.NE, 10],
    [TokenType.MATCH, 10],
    [TokenType.LT, 11],
    [TokenType.LE, 11],
    [TokenType.GT, 11],
    [TokenType.GE, 11],
    [TokenType.PLUS, 12],
    [TokenType.MINUS, 12],
    [TokenType.MULT, 13],
    [TokenType.DIV, 13],
    [TokenType.MOD, 13],
    [TokenType.DOT, 14],
    [TokenType.DOUBLE_DOT, 14]
]);

const RIGHT_ASSOCIATIVE = new Set([TokenType.ARROW, TokenType.QUESTION]);

export class Token {
    constructor(type, value, pos = 0) {
        this.type = type;
        this.value = value;
        this.pos = pos;
    }
}

export class Tokenizer {
    constructor(input) {
        this.input = input;
        this.pos = 0;
        this.length = input.length;
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

    match(str) {
        return this.input.slice(this.pos, this.pos + str.length) === str;
    }

    readNumber() {
        const start = this.pos;

        // Hex numbers
        if (this.match('0x') || this.match('0X')) {
            this.advance(2);
            while (this.pos < this.length && /[0-9a-fA-F]/.test(this.input[this.pos])) {
                this.advance();
            }
            return new Token(TokenType.NUMBER, parseInt(this.input.slice(start, this.pos), 16), start);
        }

        // Regular numbers with decimal and exponent support
        while (this.pos < this.length && /[0-9.]/.test(this.input[this.pos])) {
            this.advance();
        }

        if (this.peek() === 'e' || this.peek() === 'E') {
            this.advance();
            if (this.peek() === '+' || this.peek() === '-') {
                this.advance();
            }
            while (this.pos < this.length && /[0-9]/.test(this.input[this.pos])) {
                this.advance();
            }
        }

        return new Token(TokenType.NUMBER, parseFloat(this.input.slice(start, this.pos)), start);
    }

    readString(quote) {
        const start = this.pos;
        this.advance(); // Skip opening quote

        let value = '';
        while (this.pos < this.length && this.input[this.pos] !== quote) {
            if (this.input[this.pos] === '\\') {
                this.advance();
                const escaped = this.input[this.pos];
                switch (escaped) {
                    case 'n': value += '\n'; break;
                    case 'r': value += '\r'; break;
                    case 't': value += '\t'; break;
                    case '\\': value += '\\'; break;
                    case '"': value += '"'; break;
                    case "'": value += "'"; break;
                    default: value += escaped; break;
                }
            } else {
                value += this.input[this.pos];
            }
            this.advance();
        }

        if (this.pos < this.length) {
            this.advance(); // Skip closing quote
        }

        return new Token(TokenType.STRING, value, start);
    }

    readRegExp() {
        const start = this.pos;
        this.advance(); // Skip opening /

        let pattern = '';
        while (this.pos < this.length && this.input[this.pos] !== '/') {
            if (this.input[this.pos] === '\\') {
                pattern += this.input[this.pos];
                this.advance();
                if (this.pos < this.length) {
                    pattern += this.input[this.pos];
                }
            } else {
                pattern += this.input[this.pos];
            }
            this.advance();
        }

        if (this.pos < this.length) {
            this.advance(); // Skip closing /
        }

        // Read flags
        let flags = '';
        while (this.pos < this.length && /[gimsu]/.test(this.input[this.pos])) {
            flags += this.input[this.pos];
            this.advance();
        }

        return new Token(TokenType.REGEXP, new RegExp(pattern, flags), start);
    }

    readIdentifier() {
        const start = this.pos;

        while (this.pos < this.length && /[a-zA-Z_$0-9]/.test(this.input[this.pos])) {
            this.advance();
        }

        const value = this.input.slice(start, this.pos);

        // Check for keywords
        const keywords = {
            'true': true,
            'false': false,
            'null': null,
            'undefined': undefined,
            'Infinity': Infinity,
            'NaN': NaN,
            'and': TokenType.AND,
            'or': TokenType.OR,
            'not': TokenType.NOT,
            'is': TokenType.IS,
            'in': TokenType.IN,
            'has': TokenType.HAS
        };

        if (keywords.hasOwnProperty(value)) {
            if (typeof keywords[value] === 'string') {
                return new Token(keywords[value], value, start);
            } else {
                return new Token(TokenType.LITERAL, keywords[value], start);
            }
        }

        // Check for method call
        if (this.peek() === '(') {
            return new Token(TokenType.METHOD, value, start);
        }

        return new Token(TokenType.IDENT, value, start);
    }

    nextToken() {
        this.skipWhitespace();

        if (this.pos >= this.length) {
            return new Token(TokenType.EOF, '', this.pos);
        }

        const ch = this.input[this.pos];
        const start = this.pos;

        // Numbers
        if (/[0-9]/.test(ch) || (ch === '0' && (this.peek(1) === 'x' || this.peek(1) === 'X'))) {
            return this.readNumber();
        }

        // Strings
        if (ch === '"' || ch === "'") {
            return this.readString(ch);
        }

        // Regular expressions (basic detection)
        if (ch === '/' && !/[0-9]/.test(this.peek(1))) {
            return this.readRegExp();
        }

        // Identifiers
        if (/[a-zA-Z_]/.test(ch)) {
            return this.readIdentifier();
        }

        // Variable references and special symbols
        if (ch === '$') {
            if (this.peek(1) === '$') {
                this.advance(2);
                return new Token(TokenType.ARG1, '$$', start);
            } else if (/[a-zA-Z_]/.test(this.peek(1))) {
                this.advance();
                const ident = this.readIdentifier();
                ident.type = TokenType.VAR_REF;
                return ident;
            } else {
                this.advance();
                return new Token(TokenType.CURRENT, '$', start);
            }
        }

        // Multi-character operators
        const twoChar = this.input.slice(this.pos, this.pos + 2);
        const twoCharTokens = {
            '..': TokenType.DOUBLE_DOT,
            '=>': TokenType.ARROW,
            '!=': TokenType.NE,
            '~=': TokenType.MATCH,
            '<=': TokenType.LE,
            '>=': TokenType.GE,
            '??': TokenType.NULLISH
        };

        if (twoCharTokens[twoChar]) {
            this.advance(2);
            return new Token(twoCharTokens[twoChar], twoChar, start);
        }

        // Single character tokens
        const singleCharTokens = {
            '@': TokenType.DATA,
            '#': TokenType.CONTEXT,
            '.': TokenType.DOT,
            '|': TokenType.PIPE,
            '=': TokenType.EQ,
            '<': TokenType.LT,
            '>': TokenType.GT,
            '+': TokenType.PLUS,
            '-': TokenType.MINUS,
            '*': TokenType.MULT,
            '/': TokenType.DIV,
            '%': TokenType.MOD,
            '?': TokenType.QUESTION,
            '(': TokenType.LPAREN,
            ')': TokenType.RPAREN,
            '[': TokenType.LBRACKET,
            ']': TokenType.RBRACKET,
            '{': TokenType.LBRACE,
            '}': TokenType.RBRACE,
            ',': TokenType.COMMA,
            ':': TokenType.COLON,
            ';': TokenType.SEMICOLON
        };

        if (singleCharTokens[ch]) {
            this.advance();
            return new Token(singleCharTokens[ch], ch, start);
        }

        throw new Error(`Unexpected character '${ch}' at position ${this.pos}`);
    }
}
