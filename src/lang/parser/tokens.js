// Token type constants - using numeric codes for better performance
export const TOKEN_NUMBER = 0;
export const TOKEN_STRING = 1;
export const TOKEN_REGEXP = 2;
export const TOKEN_LITERAL = 3;
export const TOKEN_IDENT = 4;
export const TOKEN_$IDENT = 5;

// Special references
export const TOKEN_AT = 6;           // DATA
export const TOKEN_HASH = 7;         // CONTEXT
export const TOKEN_$ = 8;            // CURRENT
export const TOKEN_$$ = 9;           // ARG1

// Keywords
export const TOKEN_AND = 10;
export const TOKEN_OR = 11;
export const TOKEN_NOT = 12;
export const TOKEN_NO = 13;
export const TOKEN_IS = 14;
export const TOKEN_IN = 15;
export const TOKEN_NOTIN = 16;
export const TOKEN_HAS = 17;
export const TOKEN_HASNO = 18;
export const TOKEN_ORDER = 19;

// Method calls
export const TOKEN_METHOD_OPEN = 20;   // METHOD(
export const TOKEN_$METHOD_OPEN = 21;  // $METHOD(

// Template tokens
export const TOKEN_TEMPLATE = 22;
export const TOKEN_TPL_START = 23;
export const TOKEN_TPL_CONTINUE = 24;
export const TOKEN_TPL_END = 25;

// Operators
export const TOKEN_DOT = 26;
export const TOKEN_DOT_DOT = 27;
export const TOKEN_DOT_DOT_DOT = 28;
export const TOKEN_DOT_OPEN_PAREN = 29;
export const TOKEN_DOT_OPEN_BRACKET = 30;
export const TOKEN_DOT_DOT_OPEN_PAREN = 31;
export const TOKEN_PIPE = 32;
export const TOKEN_ARROW = 33;         // =>
export const TOKEN_EQUALS = 34;
export const TOKEN_NOT_EQUALS = 35;    // !=
export const TOKEN_MATCH = 36;         // ~=
export const TOKEN_LESS_THAN = 37;
export const TOKEN_LESS_THAN_EQUALS = 38;
export const TOKEN_GREATER_THAN = 39;
export const TOKEN_GREATER_THAN_EQUALS = 40;
export const TOKEN_PLUS = 41;
export const TOKEN_MINUS = 42;
export const TOKEN_MULTIPLY = 43;
export const TOKEN_DIVIDE = 44;
export const TOKEN_MODULO = 45;
export const TOKEN_NULLISH_COALESCING = 46; // ??
export const TOKEN_QUESTION = 47;

// Punctuation
export const TOKEN_OPEN_PAREN = 48;
export const TOKEN_CLOSE_PAREN = 49;
export const TOKEN_OPEN_BRACKET = 50;
export const TOKEN_CLOSE_BRACKET = 51;
export const TOKEN_OPEN_BRACE = 52;
export const TOKEN_CLOSE_BRACE = 53;
export const TOKEN_COMMA = 54;
export const TOKEN_COLON = 55;
export const TOKEN_SEMICOLON = 56;

// Special
export const TOKEN_EOF = 57;

// Token names for debugging and error messages
export const tokenNames = {
    [TOKEN_NUMBER]: 'NUMBER',
    [TOKEN_STRING]: 'STRING',
    [TOKEN_REGEXP]: 'REGEXP',
    [TOKEN_LITERAL]: 'LITERAL',
    [TOKEN_IDENT]: 'IDENT',
    [TOKEN_$IDENT]: '$IDENT',
    [TOKEN_AT]: '@',
    [TOKEN_HASH]: '#',
    [TOKEN_$]: '$',
    [TOKEN_$$]: '$$',
    [TOKEN_AND]: 'AND',
    [TOKEN_OR]: 'OR',
    [TOKEN_NOT]: 'NOT',
    [TOKEN_NO]: 'NO',
    [TOKEN_IS]: 'IS',
    [TOKEN_IN]: 'IN',
    [TOKEN_NOTIN]: 'NOTIN',
    [TOKEN_HAS]: 'HAS',
    [TOKEN_HASNO]: 'HASNO',
    [TOKEN_ORDER]: 'ORDER',
    [TOKEN_METHOD_OPEN]: 'METHOD(',
    [TOKEN_$METHOD_OPEN]: '$METHOD(',
    [TOKEN_TEMPLATE]: 'TEMPLATE',
    [TOKEN_TPL_START]: 'TPL_START',
    [TOKEN_TPL_CONTINUE]: 'TPL_CONTINUE',
    [TOKEN_TPL_END]: 'TPL_END',
    [TOKEN_DOT]: '.',
    [TOKEN_DOT_DOT]: '..',
    [TOKEN_DOT_DOT_DOT]: '...',
    [TOKEN_DOT_OPEN_PAREN]: '.(',
    [TOKEN_DOT_OPEN_BRACKET]: '.[',
    [TOKEN_DOT_DOT_OPEN_PAREN]: '..(',
    [TOKEN_PIPE]: '|',
    [TOKEN_ARROW]: '=>',
    [TOKEN_EQUALS]: '=',
    [TOKEN_NOT_EQUALS]: '!=',
    [TOKEN_MATCH]: '~=',
    [TOKEN_LESS_THAN]: '<',
    [TOKEN_LESS_THAN_EQUALS]: '<=',
    [TOKEN_GREATER_THAN]: '>',
    [TOKEN_GREATER_THAN_EQUALS]: '>=',
    [TOKEN_PLUS]: '+',
    [TOKEN_MINUS]: '-',
    [TOKEN_MULTIPLY]: '*',
    [TOKEN_DIVIDE]: '/',
    [TOKEN_MODULO]: '%',
    [TOKEN_NULLISH_COALESCING]: '??',
    [TOKEN_QUESTION]: '?',
    [TOKEN_OPEN_PAREN]: '(',
    [TOKEN_CLOSE_PAREN]: ')',
    [TOKEN_OPEN_BRACKET]: '[',
    [TOKEN_CLOSE_BRACKET]: ']',
    [TOKEN_OPEN_BRACE]: '{',
    [TOKEN_CLOSE_BRACE]: '}',
    [TOKEN_COMMA]: ',',
    [TOKEN_COLON]: ':',
    [TOKEN_SEMICOLON]: ';',
    [TOKEN_EOF]: 'EOF'
};

// Bracket balance mappings
export const OPEN_CLOSE_TOKEN_PAIR = new Map([
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

// Keyword lookup
export const KEYWORDS = new Map([
    ['has no', TOKEN_HASNO],
    ['not in', TOKEN_NOTIN],
    ['and', TOKEN_AND],
    ['or', TOKEN_OR],
    ['not', TOKEN_NOT],
    ['has', TOKEN_HAS],
    ['is', TOKEN_IS],
    ['in', TOKEN_IN],
    ['no', TOKEN_NO],
    ['asc', TOKEN_ORDER],
    ['ascN', TOKEN_ORDER],
    ['ascA', TOKEN_ORDER],
    ['ascNA', TOKEN_ORDER],
    ['ascAN', TOKEN_ORDER],
    ['desc', TOKEN_ORDER],
    ['descN', TOKEN_ORDER],
    ['descA', TOKEN_ORDER],
    ['descNA', TOKEN_ORDER],
    ['descAN', TOKEN_ORDER]
]);

// String to token mapping
export const STR_TO_TOKEN = new Map([
    ['...', TOKEN_DOT_DOT_DOT],
    ['..(', TOKEN_DOT_DOT_OPEN_PAREN],
    ['..', TOKEN_DOT_DOT],
    ['.(', TOKEN_DOT_OPEN_PAREN],
    ['.[', TOKEN_DOT_OPEN_BRACKET],
    ['=>', TOKEN_ARROW],
    ['!=', TOKEN_NOT_EQUALS],
    ['~=', TOKEN_MATCH],
    ['<=', TOKEN_LESS_THAN_EQUALS],
    ['>=', TOKEN_GREATER_THAN_EQUALS],
    ['??', TOKEN_NULLISH_COALESCING],
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
