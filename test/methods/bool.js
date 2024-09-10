import assert from 'assert';
import query from 'jora';

describe('bool()', () => {
    it('basic', () => {
        assert.strictEqual(
            query('bool()')(1),
            true
        );
        assert.strictEqual(
            query('bool()')(0),
            false
        );
        assert.strictEqual(
            query('.bool()')(new Uint8Array(1)),
            true
        );
    });

    it('should return false for empty arrays', () => {
        assert.strictEqual(
            query('.bool()')([]),
            false
        );
        assert.strictEqual(
            query('.bool()')(new Uint8Array(0)),
            false
        );
        assert.strictEqual(
            query('[].bool()')(),
            false
        );
    });

    it('should return false for empty objects', () => {
        assert.strictEqual(
            query('bool()')({}),
            false
        );
        assert.strictEqual(
            query('bool()')({ foo: 1}),
            true
        );
        assert.strictEqual(
            query('{}.bool()')(),
            false
        );
        assert.strictEqual(
            query('{ foo: 1 }.bool()')(),
            true
        );
    });
});
