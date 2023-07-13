import assert from 'assert';
import query from 'jora';

describe('values()', () => {
    it('should return values of own properties of an object', () => {
        assert.deepEqual(
            query('{ foo: 1, bar: undefined, baz: 1 }.values()')(),
            [1] // FIXME: should be [1, undefined, 1]
        );
    });

    it('should return values of an array', () => {
        const input = [2, 3, 4];
        const actual = query('values()')(input);

        assert.notStrictEqual(actual, input);
        assert.deepEqual(actual, input);
    });

    it('should return indexes of a string', () => {
        assert.deepEqual(
            query('"abcd".values()')(),
            ['a', 'b', 'c', 'd']
        );
    });

    it('should not fails on non-object values', () => {
        assert.deepEqual(query('values()')(), []);
        assert.deepEqual(query('null.values()')(), []);
        assert.deepEqual(query('false.values()')(), []);
        assert.deepEqual(query('123.values()')(), []);
    });
});
