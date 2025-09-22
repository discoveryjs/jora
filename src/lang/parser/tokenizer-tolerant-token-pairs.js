import {
    TOKEN_$, TOKEN_AND, TOKEN_OR, TOKEN_NOT, TOKEN_NO, TOKEN_IS, TOKEN_IN, TOKEN_NOTIN,
    TOKEN_HAS, TOKEN_HASNO, TOKEN_ORDER, TOKEN_METHOD_OPEN, TOKEN_$METHOD_OPEN,
    TOKEN_TPL_CONTINUE, TOKEN_TPL_END, TOKEN_DOT, TOKEN_DOT_DOT, TOKEN_DOT_OPEN_PAREN,
    TOKEN_DOT_OPEN_BRACKET, TOKEN_DOT_DOT_OPEN_PAREN, TOKEN_PIPE, TOKEN_ARROW, TOKEN_EQUALS,
    TOKEN_NOT_EQUALS, TOKEN_MATCH, TOKEN_LESS_THAN, TOKEN_LESS_THAN_EQUALS, TOKEN_GREATER_THAN,
    TOKEN_GREATER_THAN_EQUALS, TOKEN_PLUS, TOKEN_MINUS, TOKEN_MULTIPLY, TOKEN_DIVIDE,
    TOKEN_MODULO, TOKEN_QUESTION, TOKEN_OPEN_PAREN, TOKEN_CLOSE_PAREN, TOKEN_OPEN_BRACKET,
    TOKEN_CLOSE_BRACKET, TOKEN_CLOSE_BRACE, TOKEN_COMMA, TOKEN_COLON, TOKEN_SEMICOLON, TOKEN_EOF
} from './tokens.js';

// Precomputed tolerant token pairs - created once for all tokenizer instances
export const TOLERANT_TOKEN_PAIRS = new Map();

// Define tokens that can appear before missing tokens
const keywords = [
    TOKEN_AND, TOKEN_OR, TOKEN_IN, TOKEN_NOTIN, TOKEN_HAS, TOKEN_HASNO, TOKEN_IS
];
const operators = [
    TOKEN_PLUS, TOKEN_MINUS, TOKEN_MULTIPLY, TOKEN_DIVIDE, TOKEN_MODULO, TOKEN_PIPE,
    TOKEN_EQUALS, TOKEN_NOT_EQUALS, TOKEN_MATCH,
    TOKEN_GREATER_THAN_EQUALS, TOKEN_LESS_THAN_EQUALS, TOKEN_LESS_THAN, TOKEN_GREATER_THAN
];

// Tokens that can precede missing identifiers (trigger empty identifier insertion)
const prevTokens = [
    null, TOKEN_QUESTION, TOKEN_COLON, TOKEN_SEMICOLON,
    TOKEN_COMMA, TOKEN_DOT, TOKEN_DOT_DOT,
    TOKEN_$,  // Include $ token to enable empty identifier insertion in tolerant mode
    TOKEN_OPEN_PAREN, TOKEN_DOT_OPEN_PAREN, TOKEN_DOT_DOT_OPEN_PAREN,
    TOKEN_METHOD_OPEN, TOKEN_$METHOD_OPEN,
    TOKEN_OPEN_BRACKET, TOKEN_DOT_OPEN_BRACKET,
    TOKEN_ARROW,
    ...operators,
    ...keywords,
    TOKEN_NOT, TOKEN_NO
];

// Tokens that can follow a missing identifier (what gets inserted before)
const nextTokens = [
    TOKEN_COMMA, TOKEN_QUESTION, TOKEN_COLON, TOKEN_SEMICOLON, TOKEN_EOF,
    TOKEN_CLOSE_BRACKET, TOKEN_CLOSE_PAREN, TOKEN_CLOSE_BRACE,
    TOKEN_TPL_CONTINUE, TOKEN_TPL_END,
    ...operators,
    ...keywords,
    TOKEN_ORDER
];

// prevTokens.map(token => [token, new Set(nextTokens)])
for (const token of prevTokens) {
    TOLERANT_TOKEN_PAIRS.set(token, new Set(nextTokens));
}

// Configure empty block exclusions - valid empty constructs don't need modification
const emptyBlockTokens = [TOKEN_DOT_OPEN_PAREN, TOKEN_DOT_DOT_OPEN_PAREN, TOKEN_METHOD_OPEN, TOKEN_$METHOD_OPEN];
for (const token of emptyBlockTokens) {
    TOLERANT_TOKEN_PAIRS.get(token).delete(TOKEN_CLOSE_PAREN);
}

const emptyBracketTokens = [TOKEN_OPEN_BRACKET, TOKEN_DOT_OPEN_BRACKET];
for (const token of emptyBracketTokens) {
    TOLERANT_TOKEN_PAIRS.get(token).delete(TOKEN_CLOSE_BRACKET);
}

// Configure $ token exclusions for proper expression parsing
const dollarPairs = TOLERANT_TOKEN_PAIRS.get(TOKEN_$);

// Definition and statement terminators
dollarPairs.delete(TOKEN_SEMICOLON);  // $; should be $ followed by ; (end of definition)
dollarPairs.delete(TOKEN_EOF);        // "in $" should end with $ directly

// Operators that work directly with $
const dollarOperatorTokens = [
    // Logical and comparison operators
    TOKEN_PIPE, TOKEN_HAS, TOKEN_EQUALS, TOKEN_IN,
    // Arithmetic operators
    TOKEN_PLUS, TOKEN_MINUS, TOKEN_MULTIPLY, TOKEN_DIVIDE, TOKEN_MODULO
];
dollarOperatorTokens.forEach(token => dollarPairs.delete(token));

// Compound keywords that work directly with $
const dollarCompoundKeywords = [TOKEN_NOTIN, TOKEN_HASNO];
dollarCompoundKeywords.forEach(token => dollarPairs.delete(token));

// Closing brackets - expressions like "[ ] has $]" should end with $ directly
const dollarClosingBrackets = [TOKEN_CLOSE_BRACKET, TOKEN_CLOSE_PAREN, TOKEN_CLOSE_BRACE];
dollarClosingBrackets.forEach(token => dollarPairs.delete(token));

// Configure DOT token exclusions for proper keyword recognition
const dotPairs = TOLERANT_TOKEN_PAIRS.get(TOKEN_DOT);

// TOKEN_NOT should not trigger empty identifier insertion after DOT
// because ". not 5" should produce DOT + NOT directly (legacy behavior)
// while ". has 5" should produce DOT + IDENT("") + HAS (legacy behavior)
dotPairs.delete(TOKEN_NOT);
