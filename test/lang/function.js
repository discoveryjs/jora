import assert from 'assert';
import query from 'jora';

describe('lang/function', () => {
    it('empty function', () => {
        assert.strictEqual(
            typeof query('=>$')(),
            'function'
        );
    });

    it('body is a query', () => {
        assert.strictEqual(
            typeof query('=>foo')(),
            'function'
        );
    });

    it('allow definitions in a function', () => {
        assert.strictEqual(
            query('map(=>($a;$a))')({ a: 42 }),
            42
        );
    });

    it('body is an empty object', () => {
        assert.deepEqual(
            query('=>{}')()(),
            {}
        );
    });

    it('body is an object with a single key', () => {
        assert.deepEqual(
            query('=>{foo:1}')()(),
            { foo: 1 }
        );
    });

    it('body is an object with a couple keys', () => {
        assert.deepEqual(
            query('=>{foo:1,bar:2}')()(),
            { foo: 1, bar: 2 }
        );
    });

    it('body is an expression', () => {
        assert.strictEqual(
            typeof query('=>foo or bar')(),
            'function'
        );
    });

    it('body is an expression #2', () => {
        assert.strictEqual(
            query('map(=>foo ? 1 : 2)')({ foo: true }),
            1
        );
    });

    it('should has lower precedence than a function definition', () => {
        assert.strictEqual(
            typeof query('=> 1 | 2')(),
            'function'
        );
    });

    describe('arguments syntax', () => {
        const cases = [
            { query: '$fn: $a => $a + $$; 2.$fn(3)', expected: 5 },
            { query: '$fn: $a => .($ + $a.size()); [1, 3].$fn()', expected: [3, 5] },
            { query: '$fn: $a => ($b:2; $a + $b); 5.$fn()', expected: 7 },
            { query: '$fn: $\\u0061 => $a + 3; 5.$fn()', expected: 8 },
            { query: '$fn: () => $ + $$; 20.$fn(22)', expected: 42 },
            { query: '$fn: ($a) => $a + $; 3.$fn()', expected: 6 },
            { query: '$fn: ($a) => ($b:2; $a + $b); 3.$fn()', expected: 5 },
            { query: '$fn: ($\\u0061) => $a + 3; 5.$fn()', expected: 8 },
            { query: '$fn: ($a, $b) => $a + $ + $b + $$; 2.$fn(3)', expected: 2 + 2 + 3 + 3 },
            { query: '$fn: ($a, $\\u0062) => $a + $b; 4.$fn(2)', expected: 6 },
            { query: '$fn: ($a, $a) => $; 2.$fn(3)', error: /Duplicate parameter name "\$a" is not allowed/ }
        ];

        for (const testcase of cases) {
            it(testcase.query, () => {
                testcase.error
                    ? assert.throws(() => query(testcase.query)(), testcase.error)
                    : assert.deepStrictEqual(
                        query(testcase.query)(),
                        testcase.expected
                    );
            });
        }
    });

    describe('should has lower precedence than a compare function definition', () => {
        it('single compare', () => {
            const actual = query('=> foo desc')();

            assert.strictEqual(typeof actual, 'function');
            assert.strictEqual(
                typeof actual(),
                'function'
            );
        });
        it('a compare list', () => {
            const actual = query('[=> foo desc, bar asc]')();

            assert.strictEqual(actual.length, 1);
            assert.strictEqual(typeof actual[0], 'function');
            assert.strictEqual(actual[0]()({ foo: 2 }, { foo: 10 }), 1);
            assert.strictEqual(actual[0]()({ bar: 2 }, { bar: 10 }), -1);
            assert.strictEqual(actual[0]()({ baz: 2 }, { baz: 10 }), 0);
        });
    });
});
