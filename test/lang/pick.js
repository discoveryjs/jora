import assert from 'assert';
import query from 'jora';

describe('lang/pick', () => {
    it('should return undefined for falsy values', () => {
        assert.strictEqual(
            query('$[]')(),
            undefined
        );
    });

    describe('with no argument', () => {
        it('should return first element for an array', () => {
            assert.strictEqual(
                query('$[]')([42, 11, 22, 33]),
                42
            );
        });

        it('should return first char for a string', () => {
            assert.strictEqual(
                query('$[]')('hello'),
                'h'
            );
        });

        it('should return first entry value for an object', () => {
            assert.strictEqual(
                query('$[]')({ foo: 42, undefined: 45 }),
                42
            );
        });
    });

    describe('undefined as argument', () => {
        it('should return first element for an array', () => {
            assert.strictEqual(
                query('$[undefined]')([42, 11, 22, 33]),
                42
            );
        });

        it('should return first char for a string', () => {
            assert.strictEqual(
                query('$[undefined]')('hello'),
                'h'
            );
        });

        it('should return first entry value for an object', () => {
            assert.strictEqual(
                query('$[undefined]')({ foo: 42, undefined: 45 }),
                42
            );
        });
    });

    describe('boolean as argument', () => {
        it('should return first element when false for an array', () => {
            assert.strictEqual(
                query('$[false]')([42, 11, 22, 33]),
                42
            );
        });

        it('should return second element when true for an array', () => {
            assert.strictEqual(
                query('$[true]')([42, 11, 22, 33]),
                11
            );
        });

        it('should return first char when false for a string', () => {
            assert.strictEqual(
                query('$[false]')('hello'),
                'h'
            );
        });

        it('should return second char when true for a string', () => {
            assert.strictEqual(
                query('$[true]')('hello'),
                'e'
            );
        });

        it('should return entry value with the same name for an object', () => {
            assert.strictEqual(
                query('$[false]')({ true: 42, false: 45 }),
                45
            );
        });

        it('should return entry value with the same name for an object', () => {
            assert.strictEqual(
                query('$[true]')({ true: 42, false: 45 }),
                42
            );
        });
    });

    describe('a scalar value as argument', () => {
        it('should return an element by index for array', () => {
            assert.strictEqual(
                query('$[2]')([0, 11, 22, 33]),
                22
            );
        });
        it('should return an element by index as string for array', () => {
            assert.strictEqual(
                query('$["2"]')([0, 11, 22, 33]),
                22
            );
        });
        it('should take negative indecies for array', () => {
            assert.strictEqual(
                query('$[-3]')([0, 11, 22, 33]),
                11
            );
        });
        it('should take negative indecies as string for array', () => {
            assert.strictEqual(
                query('$["-3"]')([0, 11, 22, 33]),
                11
            );
        });

        it('should return an element by index for string', () => {
            assert.strictEqual(
                query('$[2]')('qwerty'),
                'e'
            );
        });
        it('should return an element by index as string for string', () => {
            assert.strictEqual(
                query('$["2"]')('qwerty'),
                'e'
            );
        });
        it('should return negative indecies for string', () => {
            assert.strictEqual(
                query('$[-3]')('qwerty'),
                'r'
            );
        });
        it('should return negative indecies as string for string', () => {
            assert.strictEqual(
                query('$["-3"]')('qwerty'),
                'r'
            );
        });

        it('should return a value by key for object', () => {
            assert.strictEqual(
                query('$["foo"]')({ foo: 42 }),
                42
            );
        });
    });

    describe('a function as a reference', () => {
        it('should works as Array#find() for an array', () => {
            assert.strictEqual(
                query('$[=> $ < 30]')([33, 22, 11]),
                22
            );
        });
        it('should return a value for a string', () => {
            assert.strictEqual(
                query('$[=> $ = "a"]')('foobar'),
                'a'
            );
        });
        it('should return a value for anything else', () => {
            assert.strictEqual(
                query('$[=> $ = 2]')({ foo: 1, bar: 2, baz: 3 }),
                2
            );
        });

        it('should return undefined when nothing found in array', () => {
            assert.strictEqual(
                query('$[=> $ < 10]')([44, 22, 33]),
                undefined
            );
        });
        it('should return undefined when nothing found in string', () => {
            assert.strictEqual(
                query('$[=> $ > "e"]')('abc'),
                undefined
            );
        });
        it('should return undefined when nothing found in object', () => {
            assert.strictEqual(
                query('$[=> $ = 42]')({ foo: 1, bar: 2, baz: 3 }),
                undefined
            );
        });

        it('arg1 should be an index for an array', () => {
            assert.strictEqual(
                query('$[=> $$ = 1]')([44, 22, 33]),
                22
            );
        });
        it('arg1 should be an index for a string', () => {
            assert.strictEqual(
                query('$[=> $$ = 1]')('hello'),
                'e'
            );
        });
        it('arg1 should be a key for anything else', () => {
            assert.strictEqual(
                query('$[=> $$ = "bar"]')({ foo: 1, bar: 2, baz: 3 }),
                2
            );
        });

        it('should works fine for falsy values', () => {
            assert.strictEqual(
                query('$[=> $ < 20]')(),
                undefined
            );
        });

        it('should treat empty arrays as false', () => {
            assert.deepStrictEqual(
                query('$[=> foo]')([{ foo: [] }, { foo: [1] }]),
                { foo: [1] }
            );
            assert.deepStrictEqual(
                query('$[=> foo]')({ a: { foo: [] }, b: { foo: [1] } }),
                { foo: [1] }
            );
        });
        it('should treat empty objects as false', () => {
            assert.deepStrictEqual(
                query('$[=> foo]')([{ foo: {} }, { foo: { ok: 1 } }]),
                { foo: { ok: 1 } }
            );
            assert.deepStrictEqual(
                query('$[=> foo]')({ a: { foo: {} }, b: { foo: { ok: 1 } } }),
                { foo: { ok: 1 } }
            );
        });
    });

    describe('escaped symbols in paths', () => {
        it('single quote string as a key', () => {
            assert.deepEqual(
                query('$[\'\\\'"\']')({ '\'"': 'a key with special chars' }),
                'a key with special chars'
            );
        });

        it('quote string as a key', () => {
            assert.deepEqual(
                query('$["\'\\""]')({ '\'"': 'a key with special chars' }),
                'a key with special chars'
            );
        });
    });

    describe('special cases', () => {
        it('should not return a value for array by key', () => {
            assert.strictEqual(
                query('$["length"]')([1, 2, 3]),
                undefined
            );
        });

        it('should not return a value for array even own keys', () => {
            const arr = [1, 2, 3];
            arr.foo = 123;
            assert.strictEqual(
                query('$["foo"]')(arr),
                undefined
            );
        });

        it('should not return a value for string by key', () => {
            assert.strictEqual(
                query('$["length"]')('qwerty'),
                undefined
            );
        });

        it('should not return a value for non own keys', () => {
            assert.strictEqual(
                query('$["notOwnKey"]')(Object.create({ notOwnKey: 'failed' })),
                undefined
            );
        });

        const tests = [
            ['$["foo"]["bar"]', { foo: { bar: 42 } }, 42],
            ['$[foo]', { foo: 'bar', bar: 2 }, 2],
            ['$[keys()[1]]', { foo: 'asd', bar: 42 }, 42],
            ['$["foo"].bar["baz"]', { foo: { bar: { baz: 42 } } }, 42],
            ['something.does["not"].exists', { something: {} }, undefined],
            ['.($["foo"])', [{ foo: 1 }, { foo: 2 }, {}], [1, 2]]
        ];

        for (const [queryStr, data, expected] of tests) {
            it(`${queryStr} for ${JSON.stringify(data)} should be ${JSON.stringify(expected)}`, () => {
                assert.deepEqual(
                    query(queryStr)(data),
                    expected
                );
            });
        }
    });
});
