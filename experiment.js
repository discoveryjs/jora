/**
 * Experiment module for testing parser differences
 */

import legacyParser from './src/lang/parse-old.js';
import reworkParser from './src/lang/parser/index.js';

// Test complex map operation
console.log('=== Testing ".(name + 1)" ===');

try {
    console.log('Legacy AST:');
    const legacyResult = legacyParser.parse('.(name + 1)');
    console.log(JSON.stringify(legacyResult, null, 2));
} catch (e) {
    console.log('Legacy error:', e.message);
}

try {
    console.log('\nNew AST:');
    const newResult = reworkParser.parse('.(name + 1)');
    console.log(JSON.stringify(newResult, null, 2));
} catch (e) {
    console.log('New error:', e.message);
}
