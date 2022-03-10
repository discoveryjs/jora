import assert from 'assert';
import query from 'jora';
import data from './helpers/fixture.js';

describe('keys()', () => {
    it('basic', () => {
        assert.deepEqual(
            query('.(keys())')(data).sort(),
            [...new Set(
                data
                    .reduce((res, item) => res.concat(Object.keys(item)), [])
            )].sort()
        );
    });

    it('should not fails on non-object values', () => {
        assert.deepEqual(
            query('keys()')(null).sort(),
            []
        );
    });
});
