// Temporary bridge to ensure old code continues to work
// this module is replaced in tests with ./scripts/parser-parity.js
// which runs both old and new parsers for parity checking
// and ensures that both parsers behave the same way
// once parity is confirmed, this file can be removed
// and ./src/lang/parse.js can directly use the new parser
export { default } from './parse-old.js';
