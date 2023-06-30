import assert from 'assert';
import query from 'jora';

describe('trim()', () => {
    it('string', () => {
        assert.strictEqual(
            query('trim()')('  TeSt  '),
            'TeSt'
        );
    });
    it('object', () => {
        assert.strictEqual(
            query('trim()')({}),
            '[object Object]'
        );
    });
    it('array', () => {
        assert.strictEqual(
            query('trim()')([1, '  TeSt  ']),
            '1,  TeSt'
        );
    });
    it('number', () => {
        assert.strictEqual(
            query('trim()')(1e-10),
            '1e-10'
        );
    });
});
