const assert = require('assert');
const data = require('./fixture/simple');
const query = require('../src');

describe('reverse()', () => {
    it('basic', () => {
        assert.deepEqual(
            query('filename.reverse()')(data),
            data
                .map(item => item.filename)
                .reverse()
        );
    });

    it('should be applicable for non-array values (have no effect)', () => {
        assert.deepEqual(
            query('.reverse()')(data[0]),
            data[0]
        );
    });

    it('should not mutate original data', () => {
        const data = [1, 2, 3];
        const actual = query('.reverse()')(data);

        assert.deepEqual(
            data,
            [1, 2, 3]
        );
        assert.notStrictEqual(
            actual,
            data
        );
        assert.deepEqual(
            actual,
            [3, 2, 1]
        );
    });
});
