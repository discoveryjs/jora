import assert from 'assert';
import query from 'jora';

describe('min()', () => {
    it('array of numbers', () => {
        assert.strictEqual(
            query('min()')([1, 5, 3, 2, 4]),
            1
        );
    });
    it('array of strings', () => {
        assert.strictEqual(
            query('min()')(['asd', 'foo', 'f', 'bar']),
            'asd'
        );
    });
    it('array of strings should use natural compare', () => {
        assert.strictEqual(
            query('min()')(['100%', '50%', '20%', '9%']),
            '9%'
        );
    });
    it('array of objects', () => {
        assert.deepStrictEqual(
            query('min()')([{ a: 42 }, { a: 1 }, { }, { a: 10 }]),
            { a: 42 }
        );
    });
    it('array of objects with custom comparator', () => {
        assert.deepStrictEqual(
            query('min(a asc)')([{ a: 42 }, { a: 1 }, { }, { a: 10 }]),
            { a: 1 }
        );
    });
    it('array of objects with custom comparator (reverse order)', () => {
        assert.deepStrictEqual(
            query('min(a desc)')([{ a: 1 }, { a: 42 }, { }, { a: 10 }]),
            { a: 42 }
        );
    });
    it('array of objects with custom comparator as function', () => {
        assert.deepStrictEqual(
            query('min(=> a)')([{ a: 42 }, { a: 1 }, { }, { a: 10 }]),
            { a: 1 }
        );
    });
    it('array of objects with custom comparator (no matches)', () => {
        assert.deepStrictEqual(
            query('min(foo asc)')([{ a: 1 }, { a: 42 }, { }, { a: 10 }]),
            undefined
        );
    });
    it('array of objects with custom comparator (first wins)', () => {
        assert.deepStrictEqual(
            query('min(a asc)')([{ a: 1, ok: 1 }, { a: 42 }, { }, { a: 1 }, { a: 42 }, { a: 10 }]),
            { a: 1, ok: 1 }
        );
    });
    it('mixed array', () => {
        assert.deepStrictEqual(
            query('min()')(['asd', { ok: 1 }, 'foo', 100, undefined, 50, '50', 'f', 'bar', undefined]),
            50
        );
    });
    it('mixed array with custom comparator', () => {
        assert.deepStrictEqual(
            query('min(a asc)')(['asd', { a: 42 }, 'foo', 100, undefined, { a: 12 }, '50', 'f', 'bar', undefined]),
            { a: 12 }
        );
    });
    it('mixed array with custom getter', () => {
        assert.deepStrictEqual(
            query('min(=> a)')(['asd', { a: 42 }, 'foo', 100, undefined, { a: 12 }, '50', 'f', 'bar', undefined]),
            { a: 12 }
        );
    });

    describe('TypedArray support', () => {
        it('with no getter', () => {
            assert.strictEqual(query('min()')(new Uint8Array([5, 1, 2, 3])), 1);
        });

        it('with getter', () => {
            assert.strictEqual(query('min(=> $ % 2 = 0?)')(new Uint8Array([5, 1, 2, 3])), 2);
        });
    });
});
