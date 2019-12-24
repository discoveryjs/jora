const assert = require('assert');
const query = require('./helpers/lib');
const data = require('./helpers/fixture');

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
            query('something.does["not"].exists')(data),
            []
        );

        assert.deepEqual(
            query('$[\'\\\'"\']')(data),
            ['a key with special chars']
        );

        assert.deepEqual(
            query('$["\'\\""]')(data),
            ['a key with special chars']
        );
    });

    it('array like notation to access properties and array elements', () => {
        assert.deepEqual(
            query('$["foo"]')({ foo: 42 }),
            42
        );

        assert.deepEqual(
            query('$["foo"]["bar"]')({ foo: { bar: 42 } }),
            42
        );

        assert.deepEqual(
            query('$[keys().pick(1)]')({ foo: 'asd', bar: 42 }),
            42
        );

        assert.deepEqual(
            query('$["foo"].bar["baz"]')({ foo: { bar: { baz: 42 } } }),
            42
        );

        assert.deepEqual(
            query('$[foo]')({ foo: 'bar', bar: 2 }),
            2
        );

        assert.deepEqual(
            query('$[1]')([1, 2, 3]),
            []
        );

        assert.deepEqual(
            query('"hello"[1]')(),
            'e'
        );
    });
});
