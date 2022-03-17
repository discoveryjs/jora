import assert from 'assert';
import jora from '../jora.esm.js';

it('jora.esm.js', () => {
    const actual = jora('40 + 2')();

    assert.strictEqual(actual, 42);
});
