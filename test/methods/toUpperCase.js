import assert from 'assert';
import query from 'jora';

describe('toUpperCase()', () => {
    it('string', () => {
        assert.strictEqual(
            query('toUpperCase()')('TeSt'),
            'TEST'
        );
    });
    it('object', () => {
        assert.strictEqual(
            query('toUpperCase()')({}),
            '[OBJECT OBJECT]'
        );
    });
    it('array', () => {
        assert.strictEqual(
            query('toUpperCase()')([1, 'TeSt']),
            '1,TEST'
        );
    });
    it('number', () => {
        assert.strictEqual(
            query('toUpperCase()')(1e-10),
            '1E-10'
        );
    });
    it('undefined', () => {
        assert.strictEqual(
            query('toUpperCase()')(),
            'UNDEFINED'
        );
    });
    it('null', () => {
        assert.strictEqual(
            query('toUpperCase()')(null),
            'NULL'
        );
    });

    it('using locales', () => {
        assert.strictEqual(
            query('toUpperCase()')('istanbul'),
            'ISTANBUL'
        );
        assert.strictEqual(
            query('toUpperCase("en-US")')('istanbul'),
            'ISTANBUL'
        );
        assert.strictEqual(
            query('toUpperCase("tr")')('istanbul'),
            'İSTANBUL'
        );
    });
});
