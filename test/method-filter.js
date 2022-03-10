import assert from 'assert';
import query from 'jora';
import data from './helpers/fixture.js';

describe('filter()', () => {
    it('should be the same as []', () => {
        assert.deepEqual(
            query('.[type="js"]')(data),
            query('.filter(=>type="js")')(data)
        );
    });
});
