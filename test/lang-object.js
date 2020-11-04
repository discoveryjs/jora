const assert = require('assert');
const query = require('./helpers/lib');

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
            query('{ "foo": 1, "a b": 2, \'bar\': 3, \'c d\': 4 }')(),
            { foo: 1, 'a b': 2, bar: 3, 'c d': 4 }
        );
    });

    it('a number as property name', () => {
        assert.deepEqual(
            query('{ 1: 2, 0.3: 4, .5: 6, 7.5: 8 }')(),
            { 1: 2, 0.3: 4, .5: 6, 7.5: 8 }
        );
    });

    it('a literal as property name', () => {
        assert.deepEqual(
            query('{ true: 1, false: 2, null: 3, undefined: 4 }')(),
            { true: 1, false: 2, null: 3, undefined: 4 }
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

});
