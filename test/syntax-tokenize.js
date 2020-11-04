const assert = require('assert');
const { syntax: { tokenize }} = require('./helpers/lib');

describe('syntax/tokenize', () => {
    it('tokenize', () => {
        const generator = tokenize('foo + 123');

        assert.strictEqual(typeof generator, 'object');
        assert.deepStrictEqual([...generator], [
            {
                type: 'IDENT',
                value: 'foo',
                offset: 0
            },
            {
                type: '+',
                value: '+',
                offset: 4
            },
            {
                type: 'NUMBER',
                value: '123',
                offset: 6
            },
            {
                type: 'EOF',
                value: '',
                offset: 9
            }
        ]);
    });
});
