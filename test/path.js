const assert = require('assert');
const data = require('./fixture/simple');
const query = require('../src');

describe('path', () => {
    it('should return all values', () => {
        assert.deepEqual(
            query('filename')(data),
            data
                .map(item => item.filename)
        );
    });

    it('should not fails when object have no property and should excludes undefines', () => {
        assert.deepEqual(
            query('unique')(data),
            data
                .map(item => item.unique)
                .filter(item => item !== undefined)
        );
    });

    it('should return an array of unique values', () => {
        assert.deepEqual(
            query('type')(data),
            ['css', 'js', 'svg']
        );
    });

    it('should return concated arrays', () => {
        assert.deepEqual(
            query('errors')(data),
            data
                .reduce((res, item) => res.concat(item.errors || []), [])
        );
    });

    it('should return an array for chained paths', () => {
        assert.deepEqual(
            query('refs.broken')(data),
            [true]
        );
    });

    it('should not fails on unexisted paths', () => {
        assert.deepEqual(
            query('something.does.non.exists')(data),
            []
        );
    });

    it('should allow escaped symbols in paths', () => {
        assert.deepEqual(
            query('something.does.\'not\'.exists')(data),
            []
        );

        assert.deepEqual(
            query('\'\\\'"\'')(data),
            ['a key with special chars']
        );
    });

    it('should allow expressions in parentheses', () => {
        assert.deepEqual(
            query('.(deps + dependants).filename')(data).sort(),
            [...new Set(
                data
                    .reduce((res, item) => res.concat(item.deps, item.dependants), [])
                    .map(item => item.filename)
            )].sort()
        );
    });

    it('should allow expressions in parentheses as subquery', () => {
        assert.deepEqual(
            query('errors.owner.($ + deps + dependants).filename')(data).sort(),
            [...new Set(
                data
                    .reduce((res, item) => res.concat(item.errors.map(item => item.owner)), [])
                    .reduce((res, item) => res.concat(item, item.deps, item.dependants), [])
                    .map(item => item.filename)
            )].sort()
        );
    });

    it('should work as a map', () => {
        assert.deepEqual(
            query('.({ filename, deps: deps.size() })')(data),
            data
                .map(item => ({
                    filename: item.filename,
                    deps: item.deps.length
                }))
        );
    });

    it('should work as a map (empty object)', () => {
        assert.deepEqual(
            query('.({ })')(data),
            data
                .map(() => ({ }))
        );
    });
});
