import assert from 'assert';
import query from 'jora';

describe('count()', () => {
    it('should return 0 for non-array values', () => {
        assert.strictEqual(query('count()')(), 0);
        assert.strictEqual(query('123.count()')(), 0);
        assert.strictEqual(query('true.count()')(), 0);
    });

    it('should return 0 for empty arrays', () => {
        assert.strictEqual(query('[].count()')(), 0);
    });

    it('should return 0 when an array contains nothing but undefined', () => {
        assert.strictEqual(query('[undefined, undefined].count()')(), 0);
    });

    it('should return count of non-undefined values', () => {
        assert.strictEqual(query('[1, 2, 3].count()')(), 3);
    });

    it('should not ignore duplicates', () => {
        assert.strictEqual(query('[2, 2, 2].count()')(), 3);
    });

    it('should ignore undefined', () => {
        assert.strictEqual(query('[1, undefined, 2, undefined, 3].count()')(), 3);
    });

    it('should respect values that can be converted to a number', () => {
        assert.strictEqual(query('[1, null, false, true, "2", [], [1, 2]].count()')(), 7);
    });

    it('should respect NaN', () => {
        assert.strictEqual(query('[1, NaN, "2"].count()')(), 3);
    });

    it('should respect Infinity', () => {
        assert.strictEqual(query('[1, Infinity, "2"].count()')(), 3);
    });

    describe('custom getter', () => {
        it('should use custom getter when passed', () => {
            assert.strictEqual(query('[1, 2, 3].count(=>$ * 2)')(), 3);
        });

        it('should ignore getter when getter is not a function', () => {
            assert.strictEqual(query('[1, 2, 3].count(123)')(), 3);
        });

        it('getter should get all values', () => {
            assert.strictEqual(query('count(=>$ = Infinity ? 100 : $ or 10)')(
                [1, null, undefined, Infinity, false, true, NaN, 3]
            ), 8);
        });

        it('should ignore undefined values', () => {
            assert.strictEqual(query('count(=>a)')(
                [{}, { a: 1 }, undefined, {}, { a: 3 }]
            ), 2);
        });

        it('should ignore undefined values from getter only but pass undefined in getter', () => {
            assert.strictEqual(query('count(=>$ = undefined ? 2 : a)')(
                [{}, undefined, { a: 3 }]
            ), 2);
        });

        it('should not ignore duplicates', () => {
            assert.strictEqual(query('count(=> a)')(
                [{ a: 2 }, { a: 2 }, { a: 2 }]
            ), 3);
        });
    });
});
