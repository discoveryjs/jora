const assert = require('assert');
const query = require('./helpers/lib');

describe('pick()', () => {
    it('should return undefined for falsy values', () => {
        assert.deepEqual(
            query('pick()')(),
            undefined
        );
    });

    it('should return a value by key for object', () => {
        assert.deepEqual(
            query('pick("foo")')({ foo: 42 }),
            42
        );
    });

    it('should return a value by key `undefined` for object when key is not passed', () => {
        assert.deepEqual(
            query('pick()')({ foo: 42, undefined: 45 }),
            45
        );
    });

    it('should return an element by index for array', () => {
        assert.deepEqual(
            query('pick(2)')([0, 11, 22, 33]),
            22
        );
    });

    it('should return first element for array when index is not passed', () => {
        assert.deepEqual(
            query('pick()')([42, 11, 22, 33]),
            42
        );
    });

    describe('a function as a reference', () => {
        it('should works as Array#find() for an array', () => {
            assert.deepEqual(
                query('pick(=> $ < 30)')([33, 22, 11]),
                22
            );
        });

        it('should return an entry for anything else', () => {
            assert.deepEqual(
                query('pick(=> $ = 2)')({ foo: 1, bar: 2, baz: 3 }),
                { key: 'bar', value: 2 }
            );

            assert.deepEqual(
                query('pick(=> $ = "a")')('foobar'),
                { key: 4, value: 'a' }
            );
        });

        it('should return undefined when nothing found', () => {
            assert.deepEqual(
                query('pick(=> $ < 10)')([44, 22, 33]),
                undefined
            );
            assert.deepEqual(
                query('pick(=> $ = 42)')({ foo: 1, bar: 2, baz: 3 }),
                undefined
            );
        });

        it('should works fine for falsy values', () => {
            assert.deepEqual(
                query('pick(=> $ < 20)')(),
                undefined
            );
        });
    });
});
