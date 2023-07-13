import assert from 'assert';
import query from 'jora';

describe('keys()', () => {
    it('should return own properties of an object', () => {
        assert.deepEqual(
            query('{ foo: 1, bar: undefined }.keys()')(),
            ['foo', 'bar']
        );
    });

    it('should return indexes of an array', () => {
        assert.deepEqual(
            query('[2, 3, 4].keys()')(),
            ['0', '1', '2']
        );
    });

    it('should return indexes of a string', () => {
        assert.deepEqual(
            query('"abcd".keys()')(),
            ['0', '1', '2', '3']
        );
    });

    it('should not fails on non-object values', () => {
        assert.deepEqual(query('keys()')(), []);
        assert.deepEqual(query('null.keys()')(), []);
        assert.deepEqual(query('false.keys()')(), []);
        assert.deepEqual(query('123.keys()')(), []);
    });
});
