const assert = require('assert');
const query = require('./helpers/lib');
const data = require('./helpers/fixture');

describe('filter()', () => {
    it('should be the same as []', () => {
        assert.deepEqual(
            query('.[type="js"]')(data),
            query('.filter(<(type="js")>)')(data)
        );
    });
});
