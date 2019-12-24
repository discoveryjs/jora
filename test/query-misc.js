const assert = require('assert');
const query = require('./helpers/lib');
const data = require('./helpers/fixture');

describe('query/misc', () => {
    it('can be used with template literals', () => {
        assert.deepEqual(
            query`filename`(data),
            data
                .map(item => item.filename)
        );
    });

});
