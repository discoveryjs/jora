import assert from 'assert';
import query from 'jora';

describe('numbers()', () => {
    it('should return empty array for non-array values', () => {
        assert.deepStrictEqual(query('numbers()')(), []);
        assert.deepStrictEqual(query('123.numbers()')(), []);
        assert.deepStrictEqual(query('true.numbers()')(), []);
    });

    it('should return empty array for empty arrays', () => {
        assert.deepStrictEqual(query('[].numbers()')(), []);
    });

    it('should return empty array when an array contains nothing but undefined', () => {
        assert.deepStrictEqual(query('[undefined, undefined].numbers()')(), []);
    });

    it('should return array of numbers', () => {
        assert.deepStrictEqual(query('[1, 2, 3].numbers()')(), [1, 2, 3]);
    });

    it('should not ignore duplicates', () => {
        assert.deepStrictEqual(query('[2, 2, 2].numbers()')(), [2, 2, 2]);
    });

    it('should ignore undefined', () => {
        assert.deepStrictEqual(query('[1, undefined, 2, undefined, 3].numbers()')(), [1, 2, 3]);
    });

    it('should not untilize toString/valueOf methods of objects', () => {
        assert.deepStrictEqual(query('numbers()')([
            { toString: () => 1 },
            { valueOf: () => 2 }
        ]), [NaN, NaN]);
    });

    it('should respect values that can be converted to a number', () => {
        assert.deepStrictEqual(query('[1, null, false, true, "2"].numbers()')(), [1, 0, 0, 1, 2]);
    });

    it('should respect NaN', () => {
        assert.deepStrictEqual(query('[1, NaN, "2"].numbers()')(), [1, NaN, 2]);
    });

    it('should respect Infinity', () => {
        assert.deepStrictEqual(query('[1, Infinity, "2"].numbers()')(), [1, Infinity, 2]);
    });

    describe('should not convert arrays to number', () => {
        it('empty array', () => {
            assert.deepStrictEqual(query('[[]].numbers()')(), [NaN]);
        });

        it('a single number element array', () => {
            assert.deepStrictEqual(query('[[1]].numbers()')(), [NaN]);
        });

        it('a multiple number element array', () => {
            assert.deepStrictEqual(query('[[1, 2]].numbers()')(), [NaN]);
        });

        it('array of arrays', () => {
            assert.deepStrictEqual(query('[[1, 2], [3], []].numbers()')(), [NaN, NaN, NaN]);
        });
    });

    describe('custom getter', () => {
        it('should use custom getter when passed', () => {
            assert.deepStrictEqual(query('[1, 2, 3].numbers(=>$ * 2)')(), [2, 4, 6]);
        });

        it('should ignore getter when getter is not a function', () => {
            assert.deepStrictEqual(query('[1, 2, 3].numbers(123)')(), [1, 2, 3]);
        });

        it('getter should get all values', () => {
            assert.deepStrictEqual(
                query('numbers(=>$ = Infinity ? 100 : $ or 10)')(
                    [1, null, undefined, Infinity, false, true, NaN, 3]
                ),
                [1, 10, 10, 100, 10, 1, 10, 3]
            );
        });

        it('should ignore undefined values', () => {
            assert.deepStrictEqual(query('numbers(=>a)')(
                [{}, { a: 1 }, undefined, {}, { a: 3 }]
            ), [1, 3]);
        });

        it('should ignore undefined values from getter only but pass undefined in getter', () => {
            assert.deepStrictEqual(query('numbers(=>$ = undefined ? 2 : a)')(
                [{}, undefined, { a: 3 }]
            ), [2, 3]);
        });

        it('should not ignore duplicates', () => {
            assert.deepStrictEqual(query('numbers(=> a)')(
                [{ a: 2 }, { a: 2 }, { a: 2 }]
            ), [2, 2, 2]);
        });

        it('should not convert arrays to number', () => {
            assert.deepStrictEqual(query('numbers(=> a)')(
                [{ a: [1, 2] }, { a: [] }, { a: [4] }]
            ), [NaN, NaN, NaN]);
        });

        it('result of sum', () => {
            assert.deepStrictEqual(query('numbers(=> a.sum())')(
                [{ a: [1, 2] }, { a: [] }, { a: [4] }, {}, undefined]
            ), [3, 4]);
        });
    });

    describe('custom formula', () => {
        it('should use custom formula when passed', () => {
            assert.deepStrictEqual(query('[1, 2, 3].numbers(=>$, =>$ * 10)')(), [10, 20, 30]);
        });

        it('should ignore formula when formula is not a function', () => {
            assert.deepStrictEqual(query('[1, 2, 3].numbers(=>$, 123)')(), [1, 2, 3]);
        });

        it('should not convert arrays into numbers', () => {
            assert.deepStrictEqual(query('numbers(=> $, => [1, 2][:$ - 1])')(
                [1, 2, 3]
            ), [NaN, NaN, NaN]);
        });

        it('formula should get all non-undefined values', () => {
            assert.deepStrictEqual(query('numbers(=>$ in [Infinity, NaN] ? undefined : a or $, => $ = NaN ? 42 : ($ + 1 | $ * $))')(
                [1, null, undefined, Infinity, false, true, NaN, 3, { a: [1] }]
            ), [4, 1, 1, 4, 16, 42]);
        });

        it('should ignore undefined values', () => {
            assert.deepStrictEqual(query('numbers(=>a, =>$ * $)')(
                [{}, { a: 1 }, undefined, {}, { a: 3 }]
            ), [1, 9]);
        });

        it('should ignore undefined values from getter only but pass undefined in getter', () => {
            assert.deepStrictEqual(query('numbers(=>$ = undefined ? 2 : a, => $ * $)')(
                [{}, undefined, { a: 3 }]
            ), [4, 9]);
        });

        it('should not ignore duplicates', () => {
            assert.deepStrictEqual(query('numbers(=> a, => $ * $)')(
                [{ a: 2 }, { a: 2 }, { a: 2 }]
            ), [4, 4, 4]);
        });
    });
});
