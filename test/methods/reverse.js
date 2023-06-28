import assert from 'assert';
import query from 'jora';

describe('reverse()', () => {
    it('basic', () => {
        assert.deepEqual(
            query('reverse()')([1, 2, 3, 2, 5]),
            [5, 2, 3, 2, 1]
        );
    });

    it('should be applicable for non-array values (have no effect)', () => {
        assert.deepEqual(
            query('reverse()')({ a: 1, b: 2 }),
            { a: 1, b: 2 }
        );
    });

    it('should not mutate original data', () => {
        const data = [1, 2, 3];
        const actual = query('reverse()')(data);

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
