const assert = require('assert');
const query = require('./helpers/lib');

describe('mapToArray()', () => {
    it('key only', () => {
        assert.deepEqual(
            query('mapToArray("foo")')({
                a: { value: 1 },
                b: { value: 2 }
            }),
            [
                { foo: 'a', value: 1 },
                { foo: 'b', value: 2 }
            ]
        );
    });

    it('key and value', () => {
        assert.deepEqual(
            query('mapToArray("foo", "bar")')({
                a: 1,
                b: { value: 2 }
            }),
            [
                { foo: 'a', bar: 1 },
                { foo: 'b', bar: { value: 2 } }
            ]
        );
    });

    it('should use key property to store key value when name is not passed', () => {
        assert.deepEqual(
            query('mapToArray()')({
                a: { value: 1 },
                b: { value: 2 }
            }),
            [
                { key: 'a', value: 1 },
                { key: 'b', value: 2 }
            ]
        );
    });

    it('should not fail on non-object values', () => {
        assert.deepEqual(
            query('mapToArray()')(),
            []
        );
    });
});
