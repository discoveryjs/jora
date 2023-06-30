import assert from 'assert';
import query from 'jora';

describe('toLowerCase()', () => {
    it('string', () => {
        assert.strictEqual(
            query('toLowerCase()')('TeSt'),
            'test'
        );
    });
    it('object', () => {
        assert.strictEqual(
            query('toLowerCase()')({}),
            '[object object]'
        );
    });
    it('array', () => {
        assert.strictEqual(
            query('toLowerCase()')([1, 'TeSt']),
            '1,test'
        );
    });
    it('number', () => {
        assert.strictEqual(
            query('toLowerCase()')(1e-10),
            '1e-10'
        );
    });
    it('undefined', () => {
        assert.strictEqual(
            query('toLowerCase()')(undefined),
            'undefined'
        );
    });
    it('null', () => {
        assert.strictEqual(
            query('toLowerCase()')(null),
            'null'
        );
    });

    it('using locales', () => {
        assert.strictEqual(
            query('toLowerCase()')('İstanbul'),
            'i̇stanbul'
        );
        assert.strictEqual(
            query('toLowerCase("en-US")')('İstanbul'),
            'i̇stanbul'
        );
        assert.strictEqual(
            query('toLowerCase("tr")')('İstanbul'),
            'istanbul'
        );
    });
});
