import assert from 'assert';
import query from 'jora';

describe('split()', () => {
    it('split string by string', () => {
        assert.deepEqual(
            query('split(",")')('1,2,3'),
            ['1', '2', '3']
        );
    });

    it('split string by regexp', () => {
        assert.deepEqual(
            query('split(/\\s*,\\s*/)')('1, 2 ,3 , 4,5'),
            ['1', '2', '3', '4', '5']
        );
    });

    it('split string by regexp with groups', () => {
        assert.deepEqual(
            query('split(/(,)/)')('1,2,3,4,5'),
            ['1', ',', '2', ',', '3', ',', '4', ',', '5']
        );
    });

    it('split non-string', () => {
        assert.deepEqual(
            query('split(".")')(123.456),
            ['123', '456']
        );
    });

    describe('array', () => {
        it('split empty array by undefined', () => {
            assert.deepEqual(
                query('split()')([]),
                [[]]
            );
        });
        it('split by undefined', () => {
            assert.deepEqual(
                query('split()')([2]),
                [[2]]
            );
        });
        it('split by undefined #2', () => {
            assert.deepEqual(
                query('split()')([1, 2, 3, 4, 2, 5]),
                [[1, 2, 3, 4, 2, 5]]
            );
        });

        it('split empty by value', () => {
            assert.deepEqual(
                query('split(2)')([]),
                [[]]
            );
        });
        it('split by value', () => {
            assert.deepEqual(
                query('split(2)')([2]),
                [[], []]
            );
        });
        it('split by value #2', () => {
            assert.deepEqual(
                query('split(2)')([1, 2, 3, 4, 2, 5]),
                [[1], [3, 4], [5]]
            );
        });

        it('split by NaN', () => {
            assert.deepEqual(
                query('split(NaN)')([1, NaN, 2]),
                [[1], [2]]
            );
        });

        it('split by function', () => {
            assert.deepEqual(
                query('split(=> not $ % 2)')([1, 2, 3, 4, 8, 5, 7, 6]),
                [[1], [3], [], [5, 7], []]
            );
        });
    });
});
