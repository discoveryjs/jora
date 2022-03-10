import assert from 'assert';
import query from 'jora';

describe('lang/complex cases (mixed)', () => {
    it('get a property pairs with different values', () => {
        const a = { foo: 1, bar: 2, baz: 3 };
        const b = { a: 4, foo: 1, baz: 5, c: 6 };

        assert.deepEqual(
            query(`
                (a.keys() + b.keys())
                .[@.a[$] != @.b[$]]
                .({ key: $, a: @.a[$], b: @.b[$] })
            `)({ a, b }),
            [
                { key: 'bar', a: 2, b: undefined },
                { key: 'baz', a: 3, b: 5 },
                { key: 'a', a: undefined, b: 4 },
                { key: 'c', a: undefined, b: 6 }
            ]
        );
    });

    it('get a property pairs with different values (alternative)', () => {
        const a = { foo: 1, bar: 2, baz: 3 };
        const b = { a: 4, foo: 1, baz: 5, c: 6 };

        assert.deepEqual(
            query(`
                $a; $b;
                ($a.keys() + $b.keys())
                .[$a[$] != $b[$]]
                .({ key: $, a: $a[$], b: $b[$] })
            `)({ a, b }),
            [
                { key: 'bar', a: 2, b: undefined },
                { key: 'baz', a: 3, b: 5 },
                { key: 'a', a: undefined, b: 4 },
                { key: 'c', a: undefined, b: 6 }
            ]
        );
    });
});
