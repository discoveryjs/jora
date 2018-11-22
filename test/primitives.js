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

    it('a string', () => {
        assert.strictEqual(
            query('"string"')(data),
            'string'
        );

        assert.strictEqual(
            query('"str\\"ing"')(data),
            'str"ing'
        );
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

        it('spread object', () => {
            assert.deepEqual(
                query('{ foo: 1, ...@ }')(data[1]),
                Object.assign({ foo: 1 }, data[1])
            );
        });

        it('... is an alias for ...$', () => {
            assert.deepEqual(
                query('{ foo: 1, ...,  baz: 3 }')({ foo: 2, bar: 2 }),
                query('{ foo: 1, ...$, baz: 3 }')({ foo: 2, bar: 2 })
            );

            assert.deepEqual(
                query('{ foo: 1, ...,  baz: 3 }')({ foo: 2, bar: 2 }),
                Object.assign({ foo: 1 }, { foo: 2, bar: 2 }, { baz: 3 })
            );
        });
    });
});
