import assert from 'assert';
import query from 'jora';

describe('max()', () => {
    it('array of numbers', () => {
        assert.strictEqual(
            query('max()')([1, 5, 3, 2, 4]),
            5
        );
    });
    it('array of strings', () => {
        assert.strictEqual(
            query('max()')(['asd', 'foo', 'f', 'bar']),
            'foo'
        );
    });
    it('array of strings should use natural compare', () => {
        assert.strictEqual(
            query('max()')(['100%', '50%', '20%', '9%']),
            '100%'
        );
    });
    it('array of objects', () => {
        assert.deepStrictEqual(
            query('max()')([{ a: 1 }, { a: 42 }, { }, { a: 10 }]),
            { a: 10 }
        );
    });
    it('array of objects with custom comparator', () => {
        assert.deepStrictEqual(
            query('max(a asc)')([{ a: 1 }, { a: 42 }, { }, { a: 10 }]),
            { a: 42 }
        );
    });
    it('array of objects with custom comparator (reverse order)', () => {
        assert.deepStrictEqual(
            query('max(a desc)')([{ a: 1 }, { a: 42 }, { }, { a: 10 }]),
            { a: 1 }
        );
    });
    it('array of objects with custom comparator as function', () => {
        assert.deepStrictEqual(
            query('max(=> a)')([{ a: 1 }, { a: 42 }, { }, { a: 10 }]),
            { a: 42 }
        );
    });
    it('array of objects with custom comparator (no matches)', () => {
        assert.deepStrictEqual(
            query('max(foo asc)')([{ a: 1 }, { a: 42 }, { }, { a: 10 }]),
            undefined
        );
    });
    it('array of objects with custom comparator (last wins)', () => {
        assert.deepStrictEqual(
            query('max(a asc)')([{ a: 1 }, { a: 42 }, { }, { a: 42, ok: 1 }, { a: 10 }]),
            { a: 42, ok: 1 }
        );
    });
    it('mixed array', () => {
        assert.deepStrictEqual(
            query('max()')(['asd', { ok: 1 }, 'foo', 100, undefined, '50', 'f', 'bar', undefined]),
            { ok: 1 }
        );
    });
    it('mixed array with custom comparator', () => {
        assert.deepStrictEqual(
            query('max(a asc)')(['asd', { a: 42 }, 'foo', 100, undefined, { a: 12 }, '50', 'f', 'bar', undefined]),
            { a: 42 }
        );
    });
    it('mixed array with custom getter', () => {
        assert.deepStrictEqual(
            query('max(=> a)')(['asd', { a: 42 }, 'foo', 100, undefined, { a: 12 }, '50', 'f', 'bar', undefined]),
            { a: 42 }
        );
    });
});
