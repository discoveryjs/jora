const assert = require('assert');
const query = require('./helpers/lib');

describe('lang/get-property', () => {
    it('should return all values', () => {
        assert.deepEqual(
            query('prop')([
                { prop: 1 },
                { prop: 2 },
                { prop: 3 }
            ]),
            [1, 2, 3]
        );
    });

    it('should not fails when object have no property and should excludes undefines', () => {
        assert.deepEqual(
            query('prop')([
                { },
                { prop: 42 }
            ]),
            [42]
        );
    });

    it('should dedup values', () => {
        assert.deepEqual(
            query('prop')([
                { prop: 'css' },
                { prop: 'js'},
                { prop: 'css' },
                { prop: 'svg' }
            ]),
            ['css', 'js', 'svg']
        );
    });

    it('should return concated arrays', () => {
        assert.deepEqual(
            query('prop')([
                { prop: ['foo', 'bar'] },
                { },
                { prop: undefined },
                { prop: ['baz'] }
            ]),
            ['foo', 'bar', 'baz']
        );
    });

    it('should return an array for chained paths', () => {
        assert.deepEqual(
            query('prop.test')([
                { prop: null },
                { prop: { test: true} },
                { prop: true },
                { prop: { test: [true] }}
            ]),
            [true]
        );
    });

    it('should not fails on unexisted paths', () => {
        assert.deepEqual(
            query('something.does.non.exists')([
                { something: {} },
                {}
            ]),
            []
        );
    });
});
