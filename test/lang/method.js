import assert from 'assert';
import query from 'jora';

describe('lang/method', () => {
    describe('regular method', () => {
        let queryWithExtraMethods;

        before(() => queryWithExtraMethods = query.setup({
            methods: {
                args(...args) {
                    return args;
                },
                getThis() {
                    return this;
                }
            }
        }));

        it('should invoke method()', () => {
            assert.deepEqual(
                queryWithExtraMethods('args()')(42),
                [42]
            );
        });

        it('a whitespace between method name and open parenthesis is disallowed', () => {
            assert.throws(
                () => queryWithExtraMethods('args ()')(42),
                /Parse error/
            );
        });

        it('should invoke method starting with dot, i.e. .method()', () => {
            assert.deepEqual(
                queryWithExtraMethods('.args()')(42),
                [42]
            );
        });

        it('should invoke for query', () => {
            assert.deepEqual(
                queryWithExtraMethods('$.args()')(42),
                [42]
            );
        });

        it('should invoke for recursive map', () => {
            assert.deepEqual(
                queryWithExtraMethods('..args()')(42),
                [42]
            );
        });

        it('should invoke for an array as a single value', () => {
            assert.deepEqual(
                queryWithExtraMethods('args()')([1, 2, 3]),
                [[1, 2, 3]]
            );
        });

        it('should invoke for an object as a single value', () => {
            assert.deepEqual(
                queryWithExtraMethods('args()')({ foo: 1, bar: 2 }),
                [{ foo: 1, bar: 2 }]
            );
        });

        it('should take arguments', () => {
            assert.deepEqual(
                queryWithExtraMethods('args(1, 42)')({ foo: 1, bar: 2 }),
                [{ foo: 1, bar: 2 }, 1, 42]
            );
        });

        it('methods are not referenced as a value', () => {
            assert.deepEqual(
                queryWithExtraMethods('args')({ foo: 1, bar: 2 }),
                undefined
            );
        });

        it('should rise an exception when method is not defined', () => {
            assert.throws(
                () => query('a()')({ foo: 42, bar: 123 }),
                /Method "a" is not defined/
            );
        });

        it('should not rise an exception in tolerant mode when method is not defined', () => {
            assert.strictEqual(
                query('a()', { tolerant: true })({ foo: 42, bar: 123 }),
                undefined
            );
        });

        it('"this" should be a context for call methods and having a reference to the query context', () => {
            const ctx = { ok: true };
            const actualThis = queryWithExtraMethods('getThis()')(null, ctx);

            assert.strictEqual(actualThis.context, ctx);
            assert.strictEqual(typeof actualThis.method, 'function');
            assert.strictEqual(typeof actualThis.assertion, 'function');
        });
    });

    describe('method as reference to a variable', () => {
        it('methods can be a reference to a variable', () => {
            assert.deepEqual(
                query('$a: => foo; $a()')({ foo: 42, bar: 123 }),
                42
            );
        });

        it('methods have $$ reference to second argument', () => {
            assert.deepEqual(
                query('$a: => $ + $$; foo.$a(bar)')({ foo: 42, bar: 123 }),
                42 + 123
            );
        });

        it('should rise an exception when a variable is not defined', () => {
            assert.throws(
                () => query('$a()')({ foo: 42, bar: 123 }),
                /\$a is not defined/
            );
        });

        it('should not rise an exception when a variable is not defined in tolerant mode, result of invocation is undefined', () => {
            assert.deepEqual(
                query('$a()', { tolerant: true })({ foo: 42, bar: 123 }),
                undefined
            );
        });
    });
});
