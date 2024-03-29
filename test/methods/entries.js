import assert from 'assert';
import query from 'jora';
import data from '../helpers/fixture.js';

describe('entries()', () => {
    it('basic', () => {
        assert.deepEqual(
            query('#.entries()')(data, data[0]),
            Object
                .keys(data[0])
                .map(key => ({ key, value: data[0][key] }))
        );
    });

    it('should return a index-value pairs for array', () => {
        const actual = query('entries()')(data);

        assert.deepEqual(
            actual,
            data.map((value, key) => ({ key, value }))
        );
    });

    it('should not fails on non-object values', () => {
        assert.deepEqual(
            query('entries()')(null),
            []
        );
    });
});
