const assert = require('assert');
const query = require('./helpers/lib');

describe('pick()', () => {
    it('should return undefined for falsy values', () => {
        assert.strictEqual(
            query('pick()')(),
            undefined
        );
    });

    describe('with no argument', () => {
        it('should return first element for an array', () => {
            assert.strictEqual(
                query('pick()')([42, 11, 22, 33]),
                42
            );
        });

        it('should return first char for a string', () => {
            assert.strictEqual(
                query('pick()')('hello'),
                'h'
            );
        });

        it('should return first entry value for an object', () => {
            assert.strictEqual(
                query('pick()')({ foo: 42, undefined: 45 }),
                42
            );
        });
    });

    describe('undefined as argument', () => {
        it('should return first element for an array', () => {
            assert.strictEqual(
                query('pick(undefined)')([42, 11, 22, 33]),
                42
            );
        });

        it('should return first char for a string', () => {
            assert.strictEqual(
                query('pick(undefined)')('hello'),
                'h'
            );
        });

        it('should return first entry value for an object', () => {
            assert.strictEqual(
                query('pick(undefined)')({ foo: 42, undefined: 45 }),
                42
            );
        });
    });

    describe('boolean as argument', () => {
        it('should return first element when false for an array', () => {
            assert.strictEqual(
                query('pick(false)')([42, 11, 22, 33]),
                42
            );
        });

        it('should return second element when true for an array', () => {
            assert.strictEqual(
                query('pick(true)')([42, 11, 22, 33]),
                11
            );
        });

        it('should return first char when false for a string', () => {
            assert.strictEqual(
                query('pick(false)')('hello'),
                'h'
            );
        });

        it('should return second char when true for a string', () => {
            assert.strictEqual(
                query('pick(true)')('hello'),
                'e'
            );
        });

        it('should return entry value with the same name for an object', () => {
            assert.strictEqual(
                query('pick(false)')({ true: 42, false: 45 }),
                45
            );
        });

        it('should return entry value with the same name for an object', () => {
            assert.strictEqual(
                query('pick(true)')({ true: 42, false: 45 }),
                42
            );
        });
    });

    describe('a scalar value as argument', () => {
        it('should return an element by index for array', () => {
            assert.strictEqual(
                query('pick(2)')([0, 11, 22, 33]),
                22
            );
        });
        it('should return an element by index as string for array', () => {
            assert.strictEqual(
                query('pick("2")')([0, 11, 22, 33]),
                22
            );
        });
        it('should take negative indecies for array', () => {
            assert.strictEqual(
                query('pick(-3)')([0, 11, 22, 33]),
                11
            );
        });
        it('should take negative indecies as string for array', () => {
            assert.strictEqual(
                query('pick("-3")')([0, 11, 22, 33]),
                11
            );
        });

        it('should return an element by index for string', () => {
            assert.strictEqual(
                query('pick(2)')('qwerty'),
                'e'
            );
        });
        it('should return an element by index as string for string', () => {
            assert.strictEqual(
                query('pick("2")')('qwerty'),
                'e'
            );
        });
        it('should return negative indecies for string', () => {
            assert.strictEqual(
                query('pick(-3)')('qwerty'),
                'r'
            );
        });
        it('should return negative indecies as string for string', () => {
            assert.strictEqual(
                query('pick("-3")')('qwerty'),
                'r'
            );
        });

        it('should return a value by key for object', () => {
            assert.strictEqual(
                query('pick("foo")')({ foo: 42 }),
                42
            );
        });
    });

    describe('a function as a reference', () => {
        it('should works as Array#find() for an array', () => {
            assert.strictEqual(
                query('pick(=> $ < 30)')([33, 22, 11]),
                22
            );
        });
        it('should return a value for a string', () => {
            assert.strictEqual(
                query('pick(=> $ = "a")')('foobar'),
                'a'
            );
        });
        it('should return a value for anything else', () => {
            assert.strictEqual(
                query('pick(=> $ = 2)')({ foo: 1, bar: 2, baz: 3 }),
                2
            );
        });

        it('should return undefined when nothing found in array', () => {
            assert.strictEqual(
                query('pick(=> $ < 10)')([44, 22, 33]),
                undefined
            );
        });
        it('should return undefined when nothing found in string', () => {
            assert.strictEqual(
                query('pick(=> $ > "e")')('abc'),
                undefined
            );
        });
        it('should return undefined when nothing found in object', () => {
            assert.strictEqual(
                query('pick(=> $ = 42)')({ foo: 1, bar: 2, baz: 3 }),
                undefined
            );
        });

        it('arg1 should be an index for an array', () => {
            assert.strictEqual(
                query('pick(=> $$ = 1)')([44, 22, 33]),
                22
            );
        });
        it('arg1 should be an index for a string', () => {
            assert.strictEqual(
                query('pick(=> $$ = 1)')('hello'),
                'e'
            );
        });
        it('arg1 should be a key for anything else', () => {
            assert.strictEqual(
                query('pick(=> $$ = "bar")')({ foo: 1, bar: 2, baz: 3 }),
                2
            );
        });

        it('should works fine for falsy values', () => {
            assert.strictEqual(
                query('pick(=> $ < 20)')(),
                undefined
            );
        });
    });

    describe('special cases', () => {
        it('should not return a value for array by key', () => {
            assert.strictEqual(
                query('pick("length")')([1, 2, 3]),
                undefined
            );
        });

        it('should not return a value for array even own keys', () => {
            const arr = [1, 2, 3];
            arr.foo = 123;
            assert.strictEqual(
                query('pick("foo")')(arr),
                undefined
            );
        });

        it('should not return a value for string by key', () => {
            assert.strictEqual(
                query('pick("length")')('qwerty'),
                undefined
            );
        });

        it('should not return a value for non own keys', () => {
            assert.strictEqual(
                query('pick("notOwnKey")')(Object.create({ notOwnKey: 'failed' })),
                undefined
            );
        });
    });
});
