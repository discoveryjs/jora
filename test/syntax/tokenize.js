import assert from 'assert';
import jora from 'jora';

const { syntax: { tokenize }} = jora;

describe('syntax/tokenize', () => {
    it('tokenize', () => {
        const generator = tokenize('foo + 123');
        const actual = [...generator];
        const isLegacy = typeof actual[0].offset === 'number'; // FIXME: Legacy tokens have `offset` instead of `start`/`end`
        const expected = [
            {
                type: 'IDENT',
                value: 'foo',
                start: 0,
                end: 3
            },
            {
                type: '+',
                value: '+',
                start: 4,
                end: 5
            },
            {
                type: 'NUMBER',
                value: '123',
                start: 6,
                end: 9
            },
            {
                type: 'EOF',
                value: '',
                start: 9,
                end: 9
            }
        ].map(token => (isLegacy
            ? { type: token.type, value: token.value, offset: token.start }
            : token)
        );

        assert.strictEqual(typeof generator, 'object');
        assert.deepStrictEqual(actual, expected);
    });
});
