import assert from 'assert';
import query from 'jora';
import data from './helpers/fixture.js';

describe('map()', () => {
    it('should be the same as .()', () => {
        assert.deepEqual(
            query('.(filename)')(data),
            query('.map(=>filename)')(data)
        );
    });
});
