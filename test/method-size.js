const assert = require('assert');
const query = require('./helpers/lib');

describe('size()', () => {
    it('array', () => {
        assert.equal(
            query('size()')([1, 2, 3]),
            3
        );
    });

    it('in subquery', () => {
        assert.deepEqual(
            query('.(size())')([[1], [], [2, 3]]),
            [1, 0, 2]
        );
    });

    it('should return own keys count for plain objects', () => {
        assert.equal(
            query('size()')({}),
            0
        );
        assert.equal(
            query('size()')({ foo: 1, bar: 2 }),
            2
        );
        assert.equal(
            query('size()')({ foo: 1, bar: 2, __proto__: { baz: 3 } }),
            2
        );
    });
});
