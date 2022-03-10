/* global jora */
import assert from 'assert';
const fs = require('fs');

it('jora.js', () => {
    eval(fs.readFileSync('dist/jora.js', 'utf8'));
    const actual = jora('40 + 2')();

    assert.strictEqual(actual, 42);
});
