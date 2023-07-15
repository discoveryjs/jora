import assert from 'assert';
import query from 'jora';

describe('avg()', () => {
    it('should return undefined for non-array values', () => {
        assert.strictEqual(query('avg()')(), undefined);
        assert.strictEqual(query('123.avg()')(), undefined);
        assert.strictEqual(query('true.avg()')(), undefined);
        assert.strictEqual(query('{ foo: 1, bar: 2 }.avg()')(), undefined);
    });

    it('should return undefined for empty arrays', () => {
        assert.strictEqual(query('[].avg()')(), undefined);
    });

    it('should return undefined when an array contains nothing but undefined', () => {
        assert.strictEqual(query('[undefined, undefined].avg()')(), undefined);
    });

    it('should return avg of numbers', () => {
        assert.strictEqual(query('[1, 2, 3].avg()')(), 2);
    });

    it('should not ignore duplicates', () => {
        assert.strictEqual(query('[2, 2, 2].avg()')(), 2);
    });

    it('should ignore undefined', () => {
        assert.strictEqual(query('[1, undefined, 2, undefined, 3].avg()')(), 2);
    });

    it('should respect values that can be converted to a number', () => {
        assert.strictEqual(query('[1, null, false, true, "2"].avg()')(), 4 / 5);
    });

    it('should respect NaN', () => {
        assert.strictEqual(query('[1, NaN, "2"].avg()')(), NaN);
    });

    it('should respect Infinity', () => {
        assert.strictEqual(query('[1, Infinity, "2"].avg()')(), Infinity);
    });

    describe('should not convert arrays to number', () => {
        it('empty array', () => {
            assert.strictEqual(query('[[]].avg()')(), NaN);
        });

        it('a single number element array', () => {
            assert.strictEqual(query('[[1]].avg()')(), NaN);
        });

        it('a multiple number element array', () => {
            assert.strictEqual(query('[[1, 2]].avg()')(), NaN);
        });

        it('array of arrays', () => {
            assert.strictEqual(query('[[1, 2], [3], []].avg()')(), NaN);
        });
    });

    describe('should reduce numerical error', () => {
        it('case #1', () => {
            // naive summation gives 10005.859869999998 -> avg is 2501.9999999999995
            assert.strictEqual(query('[10000.0, 3.14159, 2.71828, 2.14013].avg()')(), 2502);
        });

        it('case #2', () => {
            // naive summation gives 0.9000000000000001 -> avg is 0.22500000000000003
            assert.strictEqual(query('[0.1, 0.2, 0.3, 0.3].avg()')(), 0.225);
        });

        it('case #3', () => {
            // naive summation gives 0 -> avg is 0
            assert.strictEqual(query('[1e20, 3, -1e20].avg()')(), 1);
        });
    });

    describe('custom getter', () => {
        it('should use custom getter when passed', () => {
            assert.strictEqual(query('[1, 2, 3].avg(=>$ * 2)')(), 12 / 3);
        });

        it('should ignore getter when getter is not a function', () => {
            assert.strictEqual(query('[1, 2, 3].avg(123)')(), 6 / 3);
        });

        it('getter should get all values', () => {
            assert.strictEqual(query('avg(=>$ = Infinity ? 100 : $ or 10)')(
                [1, null, undefined, Infinity, false, true, NaN, 18]
            ), 160 / 8);
        });

        it('should ignore undefined values', () => {
            assert.strictEqual(query('avg(=>a)')(
                [{}, { a: 1 }, undefined, {}, { a: 3 }]
            ), 4 / 2);
        });

        it('should ignore undefined values from getter only but pass undefined in getter', () => {
            assert.strictEqual(query('avg(=>$ = undefined ? 5 : a)')(
                [{}, undefined, { a: 3 }]
            ), 8 / 2);
        });

        it('should not ignore duplicates', () => {
            assert.strictEqual(query('avg(=> a)')(
                [{ a: 2 }, { a: 2 }, { a: 2 }, { a: 2 }]
            ), 8 / 4);
        });

        it('should not convert arrays to number', () => {
            assert.strictEqual(query('avg(=> a)')(
                [{ a: [1, 2] }, { a: [] }, { a: [4] }]
            ), NaN);
        });

        it('avg of avg', () => {
            assert.strictEqual(query('avg(=> a.avg())')(
                [{ a: [1, 2] }, { a: [] }, { a: [4] }, {}, undefined]
            ), 5.5 / 2);
        });
    });

    describe('custom formula', () => {
        it('should use custom formula when passed', () => {
            assert.strictEqual(query('[1, 2, 3].avg(=>$, =>$ * 10)')(), 60 / 3);
        });

        it('should ignore formula when formula is not a function', () => {
            assert.strictEqual(query('[1, 2, 3].avg(=>$, 123)')(), 6 / 3);
        });

        it('formula should get all non-undefined values', () => {
            assert.strictEqual(query('avg(=>($ in [Infinity, NaN] ? undefined : $), => ($ + 1 | $ * $))')(
                [1, null, undefined, Infinity, false, true, NaN, '1', 3]
            ), 30 / 6);
        });

        it('should ignore undefined values', () => {
            assert.strictEqual(query('avg(=>a, =>$ * $)')(
                [{}, { a: 1 }, undefined, {}, { a: 3 }]
            ), 10 / 2);
        });

        it('should ignore undefined values from getter only but pass undefined in getter', () => {
            assert.strictEqual(query('avg(=>$ = undefined ? 2 : a, => $ * $)')(
                [{}, undefined, { a: 4 }]
            ), 20 / 2);
        });

        it('should not ignore duplicates', () => {
            assert.strictEqual(query('avg(=> a, => $ * $)')(
                [{ a: 2 }, { a: 2 }, { a: 2 }]
            ), 12 / 3);
        });
    });
});
