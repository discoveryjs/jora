const assert = require('assert');
const data = require('./fixture/simple');
const query = require('../src');

describe('filter()', () => {
    it('should be the same as []', () => {
        assert.deepEqual(
            query('.[type="js"]')(data),
            query('.filter(<(type="js")>)')(data)
        );
    });
});
