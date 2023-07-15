import assert from 'assert';
import query from 'jora';

describe('percentile()', () => {
    it('should return undefined for non-array values', () => {
        assert.strictEqual(query('percentile(50)')(), undefined);
        assert.strictEqual(query('123.percentile(50)')(), undefined);
        assert.strictEqual(query('true.percentile(50)')(), undefined);
        assert.strictEqual(query('{ foo: 1, bar: 2 }.percentile(50)')(), undefined);
    });

    it('should return undefined for empty arrays', () => {
        assert.strictEqual(query('[].percentile(50)')(), undefined);
    });

    it('should return undefined when an array contains nothing but undefined', () => {
        assert.strictEqual(query('[undefined, undefined].percentile(50)')(), undefined);
    });

    it('should return undefined when k is not defined or not in range', () => {
        assert.strictEqual(query('[1, 2, 3].percentile()')(), undefined);
        assert.strictEqual(query('[1, 2, 3].percentile(-1)')(), undefined);
        assert.strictEqual(query('[1, 2, 3].percentile(101)')(), undefined);
        assert.strictEqual(query('[1, 2, 3].percentile(NaN)')(), undefined);
        assert.strictEqual(query('[1, 2, 3].percentile({})')(), undefined);
    });

    it('should return percentile of numbers', () => {
        assert.strictEqual(query('[1, 3, 2].percentile(0)')(), 1);
        assert.strictEqual(query('[1, 3, 2].percentile(75)')(), 2.5);
        assert.strictEqual(query('[1, 4, 3, 2].percentile(25)')(), 1.75);
        assert.strictEqual(query('[1, 4, 3, 2].percentile(60)')(), 2.8);
    });

    it('should not ignore duplicates', () => {
        assert.strictEqual(query('[2, 2, 3, 2, 3].percentile(25)')(), 2);
        assert.strictEqual(query('[2, 2, 3, 2, 2, 3].percentile(80)')(), 3);
    });

    it('should ignore undefined', () => {
        assert.strictEqual(query('[1, undefined, undefined, undefined, 2, undefined, 3].percentile(75)')(), 2.5);
    });

    it('should respect values that can be converted to a number', () => {
        assert.strictEqual(query('[1, null, false, true, "2"].percentile(75)')(), 1);
    });

    it('should respect NaN', () => {
        assert.strictEqual(query('[1, NaN, "2"].percentile(0)')(), NaN);
    });

    it('should respect Infinity', () => {
        assert.strictEqual(query('[1, Infinity, "2"].percentile(50)')(), 2);
        assert.strictEqual(query('[1, Infinity, "2"].percentile(100)')(), Infinity);
    });

    describe('should not convert arrays to number', () => {
        it('empty array', () => {
            assert.strictEqual(query('[[]].percentile(10)')(), NaN);
        });

        it('a single number element array', () => {
            assert.strictEqual(query('[[1]].percentile(20)')(), NaN);
        });

        it('a multiple number element array', () => {
            assert.strictEqual(query('[[1, 2]].percentile(30)')(), NaN);
        });

        it('array of arrays', () => {
            assert.strictEqual(query('[[1, 2], [3], []].percentile(40)')(), NaN);
        });
    });

    describe('custom getter', () => {
        it('should use custom getter when passed', () => {
            assert.strictEqual(query('[3, 1, 2].percentile(75, =>$ * 2)')(), 5);
        });

        it('should ignore getter when getter is not a function', () => {
            assert.strictEqual(query('[1, 3, 2].percentile(75, 123)')(), 2.5);
        });

        it('getter should get all values', () => {
            assert.strictEqual(query('percentile(100 * 2 / 7, =>$ = Infinity ? 100 : $ or 10)')(
                // [1, 10, 10, 100, 10, 1, 10, 3]
                // sorted: [1, 1, 3, 10, 10, 10, 10, 100]
                [1, null, undefined, Infinity, false, true, NaN, 3]
            ), 3);
        });

        it('should ignore undefined values', () => {
            assert.strictEqual(query('percentile(25, =>a)')(
                [{}, { a: 1 }, undefined, {}, { a: 3 }, { a: 2 }]
            ), 1.5);
        });

        it('should ignore undefined values from getter only but pass undefined in getter', () => {
            assert.strictEqual(query('percentile(75, =>$ = undefined ? 2 : a)')(
                [{}, undefined, { a: 3 }, { a: 1 }]
            ), 2.5);
        });

        it('should not ignore duplicates', () => {
            assert.strictEqual(query('percentile(75, => a)')(
                [{ a: 2 }, { a: 2 }, { a: 2 }, { a: 3 }, { a: 3}]
            ), 3);
        });

        it('should not convert arrays to number', () => {
            assert.strictEqual(query('percentile(10, => a)')(
                [{ a: [1, 2] }, { a: [] }, { a: [4] }]
            ), NaN);
        });
    });

    describe('custom formula', () => {
        it('should use custom formula when passed', () => {
            assert.strictEqual(query('[1, 3, 2].percentile(75, =>$, =>$ * 10)')(), 25);
        });

        it('should ignore formula when formula is not a function', () => {
            assert.strictEqual(query('[3, 1, 2].percentile(75, =>$, 123)')(), 2.5);
        });

        it('should not convert arrays into numbers', () => {
            assert.deepStrictEqual(query('percentile(50, => $, => [1, 2][:$ - 1])')(
                [1, 2, 3]
            ), NaN);
        });

        it('formula should get all non-undefined values', () => {
            assert.strictEqual(query('percentile(75, =>($ in [Infinity, NaN] ? undefined : $), => ($ + 1 | $ * $))')(
                [1, null, undefined, Infinity, false, true, NaN, 3]
                // [4, 1, 1, 4, 16]
                // sorted: [1, 1, 4, 4, 16]
            ), 4);
        });

        it('should ignore undefined values', () => {
            assert.strictEqual(query('percentile(25, =>a, =>$ * $)')(
                [{}, { a: 1 }, undefined, {}, { a: 3 }, { a: 2 }]
            ), 2.5);
        });

        it('should ignore undefined values from getter only but pass undefined in getter', () => {
            assert.strictEqual(query('percentile(75, =>$ = undefined ? 2 : a, => $ * $)')(
                [{}, undefined, { a: 3 }, { a: 1 }]
            ), 6.5);
        });

        it('should not ignore duplicates', () => {
            assert.strictEqual(query('percentile(75, => a, => $ * $)')(
                [{ a: 2 }, { a: 2 }, { a: 2 }, { a: 3 }, { a: 3 }]
            ), 9);
        });
    });
});
