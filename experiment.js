import reworkParser from './src/lang/parser/index.js';
import legacyParser from './src/lang/parse-old.js';

function testTokenization(input, tolerant = false) {
    try {
        console.log(`Input: "${input}"`);
        [...reworkParser.tokenize(input, tolerant)].forEach((token, i) => {
            console.log(`  ${i}: ${token.type}("${token.value}")`);
        });
        console.log();
    } catch (error) {
        console.log(`Input: "${input}" - ERROR: ${error.message}`);
        console.log(error);
        console.log();
    }
}

function testParse(parser, input, tolerant = false) {
    console.log(`Input: "${input}"`);
    try {
        const result = parser.parse(input, tolerant);
        console.log(`  Result: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
        console.log(error);
        // console.log(error.message);
        // console.log(error.details);
    }
}

// Test compound keywords alone
// testTokenization('foo + 123', false);
// console.log(legacyParser.parse('|..(a)'));
// console.log(testParse(reworkParser, '$a:1; $ a', null));
// console.log(testParse(legacyParser, '$a:1; $ a', null));
console.log(testParse(reworkParser, 'is ( )', true));
console.log(testParse(legacyParser, 'is ( )', true));
// testTokenization('. not in 5');
