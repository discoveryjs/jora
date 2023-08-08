import assert from 'assert';
import query from 'jora';

describe('sum()', () => {
    it('should return undefined for non-array values', () => {
        assert.strictEqual(query('sum()')(), undefined);
        assert.strictEqual(query('123.sum()')(), undefined);
        assert.strictEqual(query('true.sum()')(), undefined);
        assert.strictEqual(query('{ foo: 1, bar: 2 }.sum()')(), undefined);
    });

    it('should return undefined for empty arrays', () => {
        assert.strictEqual(query('[].sum()')(), undefined);
    });

    it('should return undefined when an array contains nothing but undefined', () => {
        assert.strictEqual(query('[undefined, undefined].sum()')(), undefined);
    });

    it('should return sum of numbers', () => {
        assert.strictEqual(query('[1, 2, 3].sum()')(), 6);
    });

    it('should not ignore duplicates', () => {
        assert.strictEqual(query('[2, 2, 2].sum()')(), 6);
    });

    it('should ignore undefined', () => {
        assert.strictEqual(query('[1, undefined, 2, undefined, 3].sum()')(), 6);
    });

    it('should respect values that can be converted to a number', () => {
        assert.strictEqual(query('[1, null, false, true, "2"].sum()')(), 4);
    });

    it('should respect NaN', () => {
        assert.strictEqual(query('[1, NaN, "2"].sum()')(), NaN);
    });

    it('should respect Infinity', () => {
        assert.strictEqual(query('[1, Infinity, "2"].sum()')(), Infinity);
    });

    describe('should not convert arrays to number', () => {
        it('empty array', () => {
            assert.strictEqual(query('[[]].sum()')(), NaN);
        });

        it('a single number element array', () => {
            assert.strictEqual(query('[[1]].sum()')(), NaN);
        });

        it('a multiple number element array', () => {
            assert.strictEqual(query('[[1, 2]].sum()')(), NaN);
        });

        it('array of arrays', () => {
            assert.strictEqual(query('[[1, 2], [3], []].sum()')(), NaN);
        });
    });

    describe('should reduce numerical error', () => {
        it('case #1', () => {
            // naive summation gives 10005.859869999998
            assert.strictEqual(query('[10000.0, 3.14159, 2.71828].sum()')(), 10005.85987);
        });

        it('case #2', () => {
            // naive summation gives 0.6000000000000001
            assert.strictEqual(query('[0.1, 0.2, 0.3].sum()')(), 0.6);
        });

        it('case #3', () => {
            // naive summation gives 0
            assert.strictEqual(query('[1e20, 2, -1e20].sum()')(), 2);
        });
    });

    describe('custom getter', () => {
        it('should use custom getter when passed', () => {
            assert.strictEqual(query('[1, 2, 3].sum(=>$ * 2)')(), 12);
        });

        it('should ignore getter when getter is not a function', () => {
            assert.strictEqual(query('[1, 2, 3].sum(123)')(), 6);
        });

        it('getter should get all values', () => {
            assert.strictEqual(query('sum(=>$ = Infinity ? 100 : $ or 10)')(
                [1, null, undefined, Infinity, false, true, NaN, 3]
            ), 145);
        });

        it('should ignore undefined values', () => {
            assert.strictEqual(query('sum(=>a)')(
                [{}, { a: 1 }, undefined, {}, { a: 3 }]
            ), 4);
        });

        it('should ignore undefined values from getter only but pass undefined in getter', () => {
            assert.strictEqual(query('sum(=>$ = undefined ? 2 : a)')(
                [{}, undefined, { a: 3 }]
            ), 5);
        });

        it('should not ignore duplicates', () => {
            assert.strictEqual(query('sum(=> a)')(
                [{ a: 2 }, { a: 2 }, { a: 2 }]
            ), 6);
        });

        it('should not convert arrays to number', () => {
            assert.strictEqual(query('sum(=> a)')(
                [{ a: [1, 2] }, { a: [] }, { a: [4] }]
            ), NaN);
        });

        it('sum of sum', () => {
            assert.strictEqual(query('sum(=> a.sum())')(
                [{ a: [1, 2] }, { a: [] }, { a: [4] }, {}, undefined]
            ), 7);
        });
    });
});
