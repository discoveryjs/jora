import assert from 'assert';
import query from 'jora';

describe('indexOf()', () => {
    it('should return first index by default', () => {
        assert.strictEqual(query('[1, 2, 3, 1, 2, 3].indexOf(2)')(), 1);
    });

    it('should return -1 when not found', () => {
        assert.strictEqual(query('[1, 2, 3].indexOf(4)')(), -1);
    });

    it('should return -1 when indexOf is not supported', () => {
        assert.strictEqual(query('indexOf(1)')(), -1);
        assert.strictEqual(query('123.indexOf(1)')(), -1);
    });

    it('should support NaN', () => {
        assert.strictEqual(query('[1, NaN, "2"].indexOf(NaN)')(), 1);
        assert.strictEqual(query('indexOf(NaN)')(), -1);
        assert.strictEqual(query('123.indexOf(NaN)')(), -1);
    });

    it('should use strict equal', () => {
        assert.strictEqual(query('["1", true, 2, 1].indexOf(1)')(), 3);
    });

    describe('fromIndex', () => {
        it('undefined', () => {
            assert.strictEqual(query('[1, 2, 3, 1, 2, 3].indexOf(2, undefined)')(), 1);
        });

        describe('should support NaN', () => {
            it('zero index, no occurrences', () => {
                assert.strictEqual(query('[1, 2, 3, 1, 2, 3].indexOf(NaN, 0)')(), -1);
            });

            it('zero index, with occurrences', () => {
                assert.strictEqual(query('[1, 2, 3, NaN, 2, 3].indexOf(NaN, 0)')(), 3);
            });

            it('non-zero index, with occurrences', () => {
                assert.strictEqual(query('[1, 2, 3, NaN, 2, NaN, 3].indexOf(NaN, 4)')(), 5);
            });
        });

        it('positive int', () => {
            assert.strictEqual(query('[1, 2, 3, 1, 2, 3].indexOf(2, 2)')(), 4);
        });

        it('positive float', () => {
            assert.strictEqual(query('[1, 2, 3, 1, 2, 3].indexOf(2, 1.8)')(), 1);
        });

        it('negative number', () => {
            assert.strictEqual(query('[1, 2, 3, 1, 2, 3].indexOf(2, -4)')(), 4);
        });

        it('negative float', () => {
            assert.strictEqual(query('[1, 2, 3, 1, 2, 3].indexOf(2, -4.6)')(), 4);
        });

        it('should convert fromIndex to a number', () => {
            assert.strictEqual(query('[1, 2, 3, 1, 2, 3].indexOf(2, "2")')(), 4);
        });

        it('should treat NaN as 0', () => {
            assert.strictEqual(query('[1, 2, 3, 1, 2, 3].indexOf(2, "boom!")')(), 1);
        });
    });

    describe('string', () => {
        it('basic', () => {
            assert.strictEqual(query('"abcabc".indexOf("bc")')(), 1);
        });

        it('with fromIndex', () => {
            assert.strictEqual(query('"abcabc".indexOf("bc", 2)')(), 4);
        });
    });
});
