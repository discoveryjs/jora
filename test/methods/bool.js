import assert from 'assert';
import query from 'jora';
import data from '../helpers/fixture.js';

describe('bool()', () => {
    it('basic', () => {
        assert.equal(
            query('bool()')(data),
            true
        );
    });

    it('should return false for empty arrays', () => {
        assert.equal(
            query('.[foo].bool()')(data),
            false
        );
        assert.deepEqual(
            query('[].bool()')(data),
            false
        );
    });

    it('should return false for empty objects', () => {
        assert.equal(
            query('bool()')({}),
            false
        );
        assert.deepEqual(
            query('bool()')({ foo: 1}),
            true
        );
        assert.equal(
            query('{}.bool()')(),
            false
        );
        assert.equal(
            query('{ foo: 1 }.bool()')(),
            true
        );
    });
});
