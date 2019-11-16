const assert = require('assert');
const data = require('./fixture/simple');
const query = require('../src');

describe('sort()', () => {
    it('basic', () => {
        assert.deepEqual(
            query('deps.filename.sort()')(data),
            [...new Set(
                data
                    .reduce((res, item) => res.concat(item.deps), [])
                    .map(item => item.filename)
            )].sort()
        );
    });

    it('should be applicable for non-array values (have no effect)', () => {
        assert.deepEqual(
            query('.sort()')(data[0]),
            data[0]
        );
    });

    it('custom sorter', () => {
        assert.deepEqual(
            query('.sort(<refs.size()>).filename')(data),
            data
                .slice()
                .sort((a, b) => a.refs.length - b.refs.length)
                .map(item => item.filename)
        );
    });

    it('should sort by several values', () => {
        assert.deepEqual(
            query('.sort(<[dependants.size(), deps.size()]>).({filename, deps: deps.size(), dependants: dependants.size()})')(data),
            data
                .slice()
                .sort((a, b) => ((a.dependants.length - b.dependants.length) || (a.deps.length - b.deps.length)))
                .map(item => ({
                    filename: item.filename,
                    deps: item.deps.length,
                    dependants: item.dependants.length
                }))
        );
    });

    it('should not mutate original data', () => {
        const data = [3, 2, 1];
        const actual = query('.sort()')(data);

        assert.deepEqual(
            data,
            [3, 2, 1]
        );
        assert.notStrictEqual(
            actual,
            data
        );
        assert.deepEqual(
            actual,
            [1, 2, 3]
        );
    });
});
