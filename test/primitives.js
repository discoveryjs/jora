const assert = require('assert');
const data = require('./fixture/simple');
const query = require('../src');

describe('primitives', () => {
    describe('keywords', () => {
        const keywords = [
            true,
            false,
            null,
            undefined
        ];

        keywords.forEach(keyword => {
            it(String(keyword), () => {
                assert.strictEqual(
                    query(String(keyword))({ [keyword]: 42 }),
                    keyword
                );

                assert.strictEqual(
                    query(' ' + keyword + ' ')({ [keyword]: 42 }),
                    keyword
                );

                assert.strictEqual(
                    query('x' + keyword)({ ['x' + keyword]: 42 }),
                    42
                );

                assert.strictEqual(
                    query(keyword + 'x')({ [keyword + 'x']: 42 }),
                    42
                );
            });
        });
    });

    it('a number', () => {
        assert.strictEqual(
            query('123')(data),
            123
        );
    });

    describe('a string', () => {
        it('double quote', () => {
            assert.strictEqual(
                query('"string"')(data),
                'string'
            );

            assert.strictEqual(
                query('"str\\"ing"')(data),
                'str"ing'
            );
        });

        it('single quote', () => {
            assert.strictEqual(
                query("'string'")(data),
                'string'
            );

            assert.strictEqual(
                query("'str\\'ing'")(data),
                "str'ing"
            );
        });
    });

    it('a regexp', () => {
        assert.deepEqual(
            query('/foo/')(data),
            /foo/
        );

        assert.deepEqual(
            query('/foo/i')(data),
            /foo/i
        );

        assert.deepEqual(
            query('/fo\\/o/')(data),
            /fo\/o/
        );
    });

    it('a function', () => {
        assert.strictEqual(
            typeof query('<foo>')(data),
            'function'
        );
    });

    describe('an object', () => {
        it('empty object', () => {
            assert.deepEqual(
                query('{}')(),
                {}
            );
        });

        it('single property object', () => {
            assert.deepEqual(
                query('{ foo: 1 }')(),
                { foo: 1 }
            );
        });

        it('complex', () => {
            assert.deepEqual(
                query('{ foo: 1, bar: "asd", data: $ }')(data),
                { foo: 1, bar: 'asd', data }
            );
        });

        it('computed properties', () => {
            assert.deepEqual(
                query('{ [foo]: "foo" }')({ foo: 'bar' }),
                { bar: 'foo' }
            );

            assert.deepEqual(
                query('{ ["property" + @.bar]: "foo" }')({ foo: 'bar', bar: 1 }),
                { property1: 'foo' }
            );
        });

        it('spread object', () => {
            assert.deepEqual(
                query('{ foo: 1, ...bar }')({ bar: { baz: 1 } }),
                { foo: 1, baz: 1 }
            );

            assert.deepEqual(
                query('{ foo: 1, ...bar.baz }')({ bar: { baz: { qux: 1 } } }),
                { foo: 1, qux: 1 }
            );

            assert.deepEqual(
                query('{ foo: 1, ...@ }')({ bar: 2, baz: 3 }),
                { foo: 1, bar: 2, baz: 3 }
            );
        });

        it('... is an alias for ...$', () => {
            assert.deepEqual(
                query('{ foo: 1, ...,  baz: 3 }')({ foo: 2, bar: 2 }),
                query('{ foo: 1, ...$, baz: 3 }')({ foo: 2, bar: 2 })
            );

            assert.deepEqual(
                query('{ foo: 1, ...,  baz: 3 }')({ foo: 2, bar: 2, baz: 2 }),
                { foo: 2, bar: 2, baz: 3 }
            );
        });
    });

    describe('an array', () => {
        it('basic', () => {
            assert.deepEqual(
                query('[]')(data),
                []
            );

            assert.deepEqual(
                query('[1]')(data),
                [1]
            );

            assert.deepEqual(
                query('[1, 2]')(data),
                [1, 2]
            );
        });

        it('should works well with falsy values', () => {
            assert.deepEqual(
                query('[0]')(data),
                [0]
            );

            assert.deepEqual(
                query('[{}]')(data),
                [{}]
            );

            assert.deepEqual(
                query('[[]]')(data),
                [[]]
            );
        });
    });
});
