import assert from 'assert';
import query from 'jora';

describe('join()', () => {
    it('join an array with no separator', () => {
        assert.deepEqual(
            query('join()')([1, 2, 3]),
            '1,2,3'
        );
    });

    it('join an array with separator', () => {
        assert.deepEqual(
            query('join(", ")')([1, 2, 3]),
            '1, 2, 3'
        );
    });

    it('join non-array', () => {
        assert.deepEqual(
            query('join(",")')(123),
            '123'
        );
    });

    it('should work with TypedArray', () => {
        assert.deepEqual(
            query('join("-")')(new Uint8Array([1, 2, 3, 4])),
            '1-2-3-4'
        );
    });
});
