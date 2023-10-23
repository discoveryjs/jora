import assert from 'assert';
import query from 'jora';

describe('lang/object', () => {
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
        const data = { baz: 1 };

        assert.deepEqual(
            query('{ foo: 1, bar: "asd", data: $ }')(data),
            { foo: 1, bar: 'asd', data }
        );
    });

    it('a string as property name', () => {
        assert.deepEqual(
            query('{ "foo": 1, "a b": 2, \'bar\': 3, \'c d\': 4, "novalue" }')({ novalue: 'ok' }),
            { foo: 1, 'a b': 2, bar: 3, 'c d': 4, novalue: 'ok' }
        );
    });

    it('a number as property name', () => {
        assert.deepEqual(
            query('{ 1: 2, 0.3: 4, .5: 6, 7.5: 8, 42 }')({ 42: 'ok' }),
            { 1: 2, 0.3: 4, .5: 6, 7.5: 8, 42: 'ok' }
        );
    });

    describe('a literal as property name', () => {
        it('with no a value', () => {
            const input = { true: 1, false: 2, null: 3, undefined: 4, NaN: 5, Infinity: 6 };
            assert.deepEqual(
                query('{ ok: true, true, false, null, undefined, NaN, Infinity }')(input),
                { ok: true, ...input }
            );
        });
        it('with a value', () => {
            assert.deepEqual(
                query('{ true: 1, false: 2, null: 3, undefined: 4, NaN: 5, Infinity: 6 }')(),
                { true: 1, false: 2, null: 3, undefined: 4, NaN: 5, Infinity: 6 }
            );
        });
    });

    it('a property name starting with $', () => {
        assert.deepEqual(
            query('{ $foo: 1 }')(),
            { $foo: 1 }
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
            { foo: 1, foo: 2, bar: 2, baz: 3 }
        );

        assert.deepEqual(
            query('{ foo: 1, ...,  baz: 3 }')({ foo: 2, bar: 2, baz: 2 }),
            { foo: 2, bar: 2, baz: 3 }
        );
    });

    describe('definitions in object', () => {
        it('should define local variables', () => {
            assert.deepEqual(
                query('{ $a: 40; $b: 2; foo: $a + $b, $a, $b }')(),
                { foo: 42, a: 40, b: 2 }
            );
        });

        it('should overide upper variables in object definition', () => {
            assert.deepEqual(
                query('$a: 32; [{ $a }, { $a: 42; $a }, { $a }]')(),
                [{ a: 32 }, { a: 42 }, { a: 32 }]
            );
        });
    });

    describe('should allow a single trailing comma', () => {
        const valid = [
            ['{a:1,}', { a: 1 }],
            ['{ a: 1 , }', { a: 1 }],
            ['{ a: 1, b: 2, }', { a: 1, b: 2 }]
        ];
        const invalid = [
            '{,}',
            '{ , }',
            '{ , a: 1}',
            '{ a: 1,,}',
            '{a:1,,b:2}',
            '{a:1,b:2,,}'
        ];

        for (const [test, expected] of valid) {
            it(test, () =>
                assert.deepStrictEqual(
                    query(test)(),
                    expected
                )
            );
        }

        for (const test of invalid) {
            it(test, () =>
                assert.throws(
                    () => query(test),
                    /Parse error/
                )
            );
        }
    });
});
