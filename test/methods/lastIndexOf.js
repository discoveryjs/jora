import assert from 'assert';
import query from 'jora';

describe('lastIndexOf()', () => {
    it('should return first index by default', () => {
        assert.strictEqual(query('[1, 2, 3, 1, 2, 3].lastIndexOf(2)')(), 4);
    });

    it('should return -1 when not found', () => {
        assert.strictEqual(query('[1, 2, 3].lastIndexOf(4)')(), -1);
    });

    it('should return -1 when lastIndexOf is not supported', () => {
        assert.strictEqual(query('lastIndexOf(1)')(), -1);
        assert.strictEqual(query('123.lastIndexOf(1)')(), -1);
    });

    it('should support NaN', () => {
        assert.strictEqual(query('[1, NaN, "2"].lastIndexOf(NaN)')(), 1);
        assert.strictEqual(query('lastIndexOf(NaN)')(), -1);
        assert.strictEqual(query('123.lastIndexOf(NaN)')(), -1);
    });

    it('should use strict equal', () => {
        assert.strictEqual(query('[2, 1, "1", true].lastIndexOf(1)')(), 1);
    });

    describe('fromIndex', () => {
        it('undefined', () => {
            assert.strictEqual(query('[1, 2, 3, 1, 2, 3].lastIndexOf(2, undefined)')(), 4);
        });

        it('positive int', () => {
            assert.strictEqual(query('[1, 2, 3, 1, 2, 3].lastIndexOf(2, 3)')(), 1);
        });

        it('positive float', () => {
            assert.strictEqual(query('[1, 2, 3, 1, 2, 3].lastIndexOf(2, 3.8)')(), 1);
        });

        it('negative number', () => {
            assert.strictEqual(query('[1, 2, 3, 1, 2, 3].lastIndexOf(2, -2)')(), 4);
        });

        it('negative float', () => {
            assert.strictEqual(query('[1, 2, 3, 1, 2, 3].lastIndexOf(2, -2.6)')(), 4);
        });

        it('should convert fromIndex to a number', () => {
            assert.strictEqual(query('[1, 2, 3, 1, 2, 3].lastIndexOf(2, "3")')(), 1);
        });

        it('should treat NaN as 0', () => {
            assert.strictEqual(query('[1, 2, 3, 1, 2, 3].lastIndexOf(2, "boom!")')(), 4);
        });
    });

    describe('string', () => {
        it('basic', () => {
            assert.strictEqual(query('"abcabc".lastIndexOf("bc")')(), 4);
        });

        it('with fromIndex', () => {
            assert.strictEqual(query('"abcabc".lastIndexOf("bc", 3)')(), 1);
        });
    });
});
