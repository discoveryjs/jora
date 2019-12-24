const assert = require('assert');
const query = require('./helpers/lib');
const data = require('./helpers/fixture');

describe('values()', () => {
    it('basic', () => {
        assert.deepEqual(
            query('.[filename="1.css"].(values())')(data),
            [...new Set(
                Object.values(data[0])
                    .reduce((res, item) => res.concat(item), [])
            )]
        );
    });

    it('should return a slice of array', () => {
        const actual = query('values()')(data);

        assert.deepEqual(
            actual,
            data
        );
        assert.notStrictEqual(
            actual,
            data
        );
    });

    it('should not fails on non-object values', () => {
        assert.deepEqual(
            query('values()')(null),
            []
        );
    });
});
