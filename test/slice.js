const assert = require('assert');
const data = require('./fixture/simple');
const query = require('../src');

// https://github.com/tc39/proposal-slice-notation/blob/master/README.md
// without a `step` argument

describe('size | [N:N]', () => {
    it('should be a data root', () => {
        assert.deepEqual(
            query('[0:3]')(data),
            data.slice(0, 3)
        );
    });

    it('should be a subquery', () => {
        assert.deepEqual(
            query('filename[0:3]')(data),
            data.map(i => i.filename).slice(0, 3)
        );
    });

    it('top 3 items from root', () => {
        assert.deepEqual(
            query('[:3]')(data),
            data.slice(0, 3)
        );
    });

    it('top 3 items from subquery', () => {
        assert.deepEqual(
            query('filename[:3]')(data),
            data.map(i => i.filename).slice(0, 3)
        );
    });


    it('from third item from root', () => {
        assert.deepEqual(
            query('[2:]')(data),
            data.slice(2)
        );
    });

    it('from third item from subquery', () => {
        assert.deepEqual(
            query('filename[2:]')(data),
            data.map(i => i.filename).slice(2)
        );
    });

    it('just slice from root', () => {
        assert.deepEqual(
            query('[:]')(data),
            data.slice()
        );
    });

    it('just slice from subquery', () => {
        assert.deepEqual(
            query('filename[:]')(data),
            data.map(i => i.filename).slice()
        );
    });
});
