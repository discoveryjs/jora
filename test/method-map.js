const assert = require('assert');
const data = require('./fixture/simple');
const query = require('./helpers/lib');

describe('map()', () => {
    it('should be the same as .()', () => {
        assert.deepEqual(
            query('.(filename)')(data),
            query('.map(<filename>)')(data)
        );
    });
});
