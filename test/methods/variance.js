import assert from 'assert';
import query from 'jora';

describe('variance()', () => {
    it('should return undefined for non-array values', () => {
        assert.strictEqual(query('variance()')(), undefined);
        assert.strictEqual(query('123.variance()')(), undefined);
        assert.strictEqual(query('true.variance()')(), undefined);
        assert.strictEqual(query('{ foo: 1, bar: 2 }.variance()')(), undefined);
    });

    it('should return undefined for empty arrays', () => {
        assert.strictEqual(query('[].variance()')(), undefined);
    });

    it('should return undefined when an array contains nothing but undefined', () => {
        assert.strictEqual(query('[undefined, undefined].variance()')(), undefined);
    });

    it('should return variance of numbers', () => {
        assert.strictEqual(query('[1, 2, 3].variance()')(), 2 / 3);
        assert.strictEqual(query('[1, 2, 3, 4, 5].variance()')(), 2);
        assert.strictEqual(query('[1e10, 1e10 + 1, 1e10 + 2].variance()')(), 2 / 3);
        assert.strictEqual(query('[1e-10, 1e-10 - 1e-11, 1e-10 + 1e-11].variance()')(), 2 * ((1e-10 - 1e-11 - 1e-10) ** 2) / 3);
    });

    it('should not ignore duplicates', () => {
        assert.strictEqual(query('[2, 2, 2].variance()')(), 0);
    });

    it('should ignore undefined', () => {
        assert.strictEqual(query('[1, undefined, 2, undefined, 3].variance()')(), 2 / 3);
    });

    it('should respect values that can be converted to a number', () => {
        assert.strictEqual(query('[1, null, false, true, "2"].variance()')(), 0.5599999999999999);
    });

    it('should respect NaN', () => {
        assert.strictEqual(query('[1, NaN, "2"].variance()')(), NaN);
    });

    it('should respect Infinity', () => {
        assert.strictEqual(query('[1, Infinity, "2"].variance()')(), NaN);
    });

    describe('should not convert arrays to number', () => {
        it('empty array', () => {
            assert.strictEqual(query('[[]].variance()')(), NaN);
        });

        it('a single number element array', () => {
            assert.strictEqual(query('[[1]].variance()')(), NaN);
        });

        it('a multiple number element array', () => {
            assert.strictEqual(query('[[1, 2]].variance()')(), NaN);
        });

        it('array of arrays', () => {
            assert.strictEqual(query('[[1, 2], [3], []].variance()')(), NaN);
        });
    });

    describe('custom getter', () => {
        it('should use custom getter when passed', () => {
            assert.strictEqual(query('[1, 2, 3].variance(=>$ * 2)')(), 8 / 3);
        });

        it('should ignore getter when getter is not a function', () => {
            assert.strictEqual(query('[1, 2, 3].variance(123)')(), 2 / 3);
        });

        it('getter should get all values', () => {
            assert.strictEqual(query('variance(=>$ = Infinity ? 100 : $ or 10)')(
                [1, null, undefined, Infinity, false, true, NaN, 18]
            ), 940.75);
        });

        it('should ignore undefined values', () => {
            assert.strictEqual(query('variance(=>a)')(
                [{}, { a: 1 }, undefined, {}, { a: 3 }]
            ), 1);
        });

        it('should ignore undefined values from getter only but pass undefined in getter', () => {
            assert.strictEqual(query('variance(=>$ = undefined ? 5 : a)')(
                [{}, undefined, { a: 3 }]
            ), 1);
        });

        it('should not ignore duplicates', () => {
            assert.strictEqual(query('variance(=> a)')(
                [{ a: 2 }, { a: 2 }, { a: 2 }, { a: 2 }]
            ), 0);
        });

        it('should not convert arrays to number', () => {
            assert.strictEqual(query('variance(=> a)')(
                [{ a: [1, 2] }, { a: [] }, { a: [4] }]
            ), NaN);
        });

        it('variance of variance', () => {
            assert.strictEqual(query('variance(=> a.variance())')(
                [{ a: [1, 3] }, { a: [] }, { a: [2, 8] }, {}, undefined]
            ), 16);
        });
    });

    describe('custom formula', () => {
        it('should use custom formula when passed', () => {
            assert.strictEqual(query('[1, 2, 3].variance(=>$, =>$ * 2)')(), 8 / 3);
        });

        it('should ignore formula when formula is not a function', () => {
            assert.strictEqual(query('[1, 2, 3].variance(=>$, 123)')(), 2 / 3);
        });

        it('formula should get all non-undefined values', () => {
            assert.strictEqual(query('variance(=>($ in [Infinity, NaN] ? undefined : $), => ($ + 1 | $ * $))')(
                [1, null, undefined, Infinity, false, true, NaN, '1', 3]
            ), 26);
        });

        it('should ignore undefined values', () => {
            assert.strictEqual(query('variance(=>a, =>$ * 2)')(
                [{}, { a: 1 }, undefined, {}, { a: 3 }]
            ), 4);
        });

        it('should ignore undefined values from getter only but pass undefined in getter', () => {
            assert.strictEqual(query('variance(=>$ = undefined ? 2 : a, => $ * 2)')(
                [{}, undefined, { a: 4 }]
            ), 4);
        });

        it('should not ignore duplicates', () => {
            assert.strictEqual(query('variance(=> a, => $ * $)')(
                [{ a: 2 }, { a: 2 }, { a: 2 }]
            ), 0);
        });
    });
});
