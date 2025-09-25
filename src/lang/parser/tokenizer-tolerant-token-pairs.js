import {
    TOKEN_$, TOKEN_AND, TOKEN_OR, TOKEN_NOT, TOKEN_NO, TOKEN_IS, TOKEN_IN, TOKEN_NOTIN,
    TOKEN_HAS, TOKEN_HASNO, TOKEN_ORDER, TOKEN_METHOD_OPEN, TOKEN_$METHOD_OPEN,
    TOKEN_TPL_CONTINUE, TOKEN_TPL_END, TOKEN_DOT, TOKEN_DOT_DOT, TOKEN_DOT_OPEN_PAREN,
    TOKEN_DOT_OPEN_BRACKET, TOKEN_DOT_DOT_OPEN_PAREN, TOKEN_PIPE, TOKEN_ARROW, TOKEN_EQUALS,
    TOKEN_NOT_EQUALS, TOKEN_MATCH, TOKEN_LESS_THAN, TOKEN_LESS_THAN_EQUALS, TOKEN_GREATER_THAN,
    TOKEN_GREATER_THAN_EQUALS, TOKEN_PLUS, TOKEN_MINUS, TOKEN_MULTIPLY, TOKEN_DIVIDE,
    TOKEN_MODULO, TOKEN_QUESTION, TOKEN_OPEN_PAREN, TOKEN_CLOSE_PAREN, TOKEN_OPEN_BRACKET,
    TOKEN_CLOSE_BRACKET, TOKEN_CLOSE_BRACE, TOKEN_COMMA, TOKEN_COLON, TOKEN_SEMICOLON, TOKEN_EOF,
    createTokenSet
} from './tokens.js';

// Optimized tolerant token pairs with shared sets for better memory usage
const keywords = [TOKEN_AND, TOKEN_OR, TOKEN_IN, TOKEN_NOTIN, TOKEN_HAS, TOKEN_HASNO, TOKEN_IS];
const operators = [
    TOKEN_PLUS, TOKEN_MINUS, TOKEN_MULTIPLY, TOKEN_DIVIDE, TOKEN_MODULO, TOKEN_PIPE,
    TOKEN_EQUALS, TOKEN_NOT_EQUALS, TOKEN_MATCH,
    TOKEN_GREATER_THAN_EQUALS, TOKEN_LESS_THAN_EQUALS, TOKEN_LESS_THAN, TOKEN_GREATER_THAN
];
const baseTokens = [
    TOKEN_COMMA, TOKEN_QUESTION, TOKEN_COLON, TOKEN_SEMICOLON, TOKEN_EOF,
    TOKEN_CLOSE_BRACKET, TOKEN_CLOSE_PAREN, TOKEN_CLOSE_BRACE,
    TOKEN_TPL_CONTINUE, TOKEN_TPL_END, TOKEN_ORDER,
    ...operators,
    ...keywords
];

// Shared set of tokens that can follow a missing identifier
const commonNextTokens = createTokenSet(...baseTokens);

// Specialized sets for tokens that need exclusions
const emptyBlockNextTokens = createTokenSet(...baseTokens);
emptyBlockNextTokens[TOKEN_CLOSE_PAREN] = 0;

const emptyBracketNextTokens = createTokenSet(...baseTokens);
emptyBracketNextTokens[TOKEN_CLOSE_BRACKET] = 0;

const dollarNextTokens = createTokenSet(
    TOKEN_COMMA, TOKEN_QUESTION, TOKEN_COLON,
    TOKEN_TPL_CONTINUE, TOKEN_TPL_END, TOKEN_ORDER,
    ...operators,
    ...keywords
);
// Exclude operators and keywords that work directly with $
[
    TOKEN_PIPE, TOKEN_EQUALS, TOKEN_PLUS, TOKEN_MINUS,
    TOKEN_MULTIPLY, TOKEN_DIVIDE, TOKEN_MODULO,
    TOKEN_IN, TOKEN_HAS, TOKEN_NOTIN, TOKEN_HASNO
].forEach(token => dollarNextTokens[token] = 0);

// Create the lookup map with optimized shared sets
export const TOLERANT_TOKEN_PAIRS = new Map([
    // Tokens that can precede missing identifiers
    [null, commonNextTokens],
    [TOKEN_QUESTION, commonNextTokens],
    [TOKEN_COLON, commonNextTokens],
    [TOKEN_SEMICOLON, commonNextTokens],
    [TOKEN_COMMA, commonNextTokens],
    [TOKEN_DOT, commonNextTokens],
    [TOKEN_DOT_DOT, commonNextTokens],
    [TOKEN_OPEN_PAREN, commonNextTokens],
    [TOKEN_ARROW, commonNextTokens],
    [TOKEN_NOT, commonNextTokens],
    [TOKEN_NO, commonNextTokens],

    // Tokens with exclusions for empty constructs
    [TOKEN_DOT_OPEN_PAREN, emptyBlockNextTokens],
    [TOKEN_DOT_DOT_OPEN_PAREN, emptyBlockNextTokens],
    [TOKEN_METHOD_OPEN, emptyBlockNextTokens],
    [TOKEN_$METHOD_OPEN, emptyBlockNextTokens],
    [TOKEN_OPEN_BRACKET, emptyBracketNextTokens],
    [TOKEN_DOT_OPEN_BRACKET, emptyBracketNextTokens],

    // Special handling for $ token
    [TOKEN_$, dollarNextTokens],

    // Operators and keywords
    ...operators.map(op => [op, commonNextTokens]),
    ...keywords.map(kw => [kw, commonNextTokens])
]);
