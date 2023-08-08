import assert from 'assert';
import query from 'jora';

describe('median()', () => {
    it('should return undefined for non-array values', () => {
        assert.strictEqual(query('median()')(), undefined);
        assert.strictEqual(query('123.median()')(), undefined);
        assert.strictEqual(query('true.median()')(), undefined);
        assert.strictEqual(query('{ foo: 1, bar: 2 }.median()')(), undefined);
    });

    it('should return undefined for empty arrays', () => {
        assert.strictEqual(query('[].median()')(), undefined);
    });

    it('should return undefined when an array contains nothing but undefined', () => {
        assert.strictEqual(query('[undefined, undefined].median()')(), undefined);
    });

    it('should return median of numbers', () => {
        assert.strictEqual(query('[1, 3, 2].median()')(), 2);
        assert.strictEqual(query('[1, 4, 3, 2].median()')(), 2.5);
    });

    it('should not ignore duplicates', () => {
        assert.strictEqual(query('[2, 2, 3, 2, 3].median()')(), 2);
        assert.strictEqual(query('[2, 2, 3, 2, 2, 3].median()')(), 2);
    });

    it('should ignore undefined', () => {
        assert.strictEqual(query('[1, undefined, undefined, undefined, 2, undefined, 3].median()')(), 2);
    });

    it('should respect values that can be converted to a number', () => {
        assert.strictEqual(query('[1, null, false, true, "2"].median()')(), 1);
    });

    it('should respect NaN', () => {
        assert.strictEqual(query('[1, NaN, "2"].median()')(), NaN);
    });

    it('should respect Infinity', () => {
        assert.strictEqual(query('[1, Infinity, "2"].median()')(), 2);
    });

    describe('should not convert arrays to number', () => {
        it('empty array', () => {
            assert.strictEqual(query('[[]].median()')(), NaN);
        });

        it('a single number element array', () => {
            assert.strictEqual(query('[[1]].median()')(), NaN);
        });

        it('a multiple number element array', () => {
            assert.strictEqual(query('[[1, 2]].median()')(), NaN);
        });

        it('array of arrays', () => {
            assert.strictEqual(query('[[1, 2], [3], []].median()')(), NaN);
        });
    });

    describe('custom getter', () => {
        it('should use custom getter when passed', () => {
            assert.strictEqual(query('[3, 1, 2].median(=>$ * 2)')(), 4);
        });

        it('should ignore getter when getter is not a function', () => {
            assert.strictEqual(query('[1, 3, 2].median(123)')(), 2);
        });

        it('getter should get all values', () => {
            assert.strictEqual(query('median(=>$ = Infinity ? 100 : $ or 10)')(
                // [1, 10, 10, 100, 10, 1, 10, 3]
                // sorted: [1, 1, 3, 10, 10, 10, 10, 100]
                [1, null, undefined, Infinity, false, true, NaN, 3]
            ), 10);
        });

        it('should ignore undefined values', () => {
            assert.strictEqual(query('median(=>a)')(
                [{}, { a: 1 }, undefined, {}, { a: 3 }, { a: 2 }]
            ), 2);
        });

        it('should ignore undefined values from getter only but pass undefined in getter', () => {
            assert.strictEqual(query('median(=>$ = undefined ? 2 : a)')(
                [{}, undefined, { a: 3 }, { a: 1 }]
            ), 2);
        });

        it('should not ignore duplicates', () => {
            assert.strictEqual(query('median(=> a)')(
                [{ a: 2 }, { a: 2 }, { a: 2 }, { a: 3 }, { a: 3}]
            ), 2);
        });

        it('should not convert arrays to number', () => {
            assert.strictEqual(query('median(=> a)')(
                [{ a: [1, 2] }, { a: [] }, { a: [4] }]
            ), NaN);
        });
    });
});
