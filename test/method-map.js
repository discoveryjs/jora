const assert = require('assert');
const query = require('./helpers/lib');
const data = require('./helpers/fixture');

describe('map()', () => {
    it('should be the same as .()', () => {
        assert.deepEqual(
            query('.(filename)')(data),
            query('.map(<filename>)')(data)
        );
    });
});
