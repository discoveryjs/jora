import assert from 'assert';
import query from 'jora';

describe('stdev()', () => {
    it('should return undefined for non-array values', () => {
        assert.strictEqual(query('stdev()')(), undefined);
        assert.strictEqual(query('123.stdev()')(), undefined);
        assert.strictEqual(query('true.stdev()')(), undefined);
        assert.strictEqual(query('{ foo: 1, bar: 2 }.stdev()')(), undefined);
    });

    it('should return undefined for empty arrays', () => {
        assert.strictEqual(query('[].stdev()')(), undefined);
    });

    it('should return undefined when an array contains nothing but undefined', () => {
        assert.strictEqual(query('[undefined, undefined].stdev()')(), undefined);
    });

    it('should return stdev of numbers', () => {
        assert.strictEqual(query('[1, 2, 3].stdev()')(), Math.sqrt(2 / 3));
        assert.strictEqual(query('[1, 2, 3, 4, 5].stdev()')(), Math.sqrt(2));
        assert.strictEqual(query('[1e10, 1e10 + 1, 1e10 + 2].stdev()')(), Math.sqrt(2 / 3));
        assert.strictEqual(query('[1e-10, 1e-10 - 1e-11, 1e-10 + 1e-11].stdev()')(), Math.sqrt(2 * ((1e-10 - 1e-11 - 1e-10) ** 2) / 3));
    });

    it('should not ignore duplicates', () => {
        assert.strictEqual(query('[2, 2, 2].stdev()')(), 0);
    });

    it('should ignore undefined', () => {
        assert.strictEqual(query('[1, undefined, 2, undefined, 3].stdev()')(), Math.sqrt(2 / 3));
    });

    it('should respect values that can be converted to a number', () => {
        assert.strictEqual(query('[1, null, false, true, "2"].stdev()')(), 0.7483314773547882);
    });

    it('should respect NaN', () => {
        assert.strictEqual(query('[1, NaN, "2"].stdev()')(), NaN);
    });

    it('should respect Infinity', () => {
        assert.strictEqual(query('[1, Infinity, "2"].stdev()')(), NaN);
    });

    describe('should not convert arrays to number', () => {
        it('empty array', () => {
            assert.strictEqual(query('[[]].stdev()')(), NaN);
        });

        it('a single number element array', () => {
            assert.strictEqual(query('[[1]].stdev()')(), NaN);
        });

        it('a multiple number element array', () => {
            assert.strictEqual(query('[[1, 2]].stdev()')(), NaN);
        });

        it('array of arrays', () => {
            assert.strictEqual(query('[[1, 2], [3], []].stdev()')(), NaN);
        });
    });

    describe('custom getter', () => {
        it('should use custom getter when passed', () => {
            assert.strictEqual(query('[1, 2, 3].stdev(=>$ * 2)')(), Math.sqrt(8 / 3));
        });

        it('should ignore getter when getter is not a function', () => {
            assert.strictEqual(query('[1, 2, 3].stdev(123)')(), Math.sqrt(2 / 3));
        });

        it('getter should get all values', () => {
            assert.strictEqual(query('stdev(=>$ = Infinity ? 100 : $ or 10)')(
                [1, null, undefined, Infinity, false, true, NaN, 18]
            ), 30.671648146130003);
        });

        it('should ignore undefined values', () => {
            assert.strictEqual(query('stdev(=>a)')(
                [{}, { a: 1 }, undefined, {}, { a: 3 }]
            ), 1);
        });

        it('should ignore undefined values from getter only but pass undefined in getter', () => {
            assert.strictEqual(query('stdev(=>$ = undefined ? 5 : a)')(
                [{}, undefined, { a: 3 }]
            ), 1);
        });

        it('should not ignore duplicates', () => {
            assert.strictEqual(query('stdev(=> a)')(
                [{ a: 2 }, { a: 2 }, { a: 2 }, { a: 2 }]
            ), 0);
        });

        it('should not convert arrays to number', () => {
            assert.strictEqual(query('stdev(=> a)')(
                [{ a: [1, 2] }, { a: [] }, { a: [4] }]
            ), NaN);
        });

        it('stdev of stdev', () => {
            assert.strictEqual(query('stdev(=> a.stdev())')(
                [{ a: [1, 3] }, { a: [] }, { a: [2, 8] }, {}, undefined]
            ), 1);
        });
    });
});
