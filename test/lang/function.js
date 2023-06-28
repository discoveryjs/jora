import assert from 'assert';
import query from 'jora';

describe('lang/function (legacy)', () => {
    it('empty function', () => {
        assert.strictEqual(
            typeof query('<>')(),
            'function'
        );
    });

    it('body is a query', () => {
        assert.strictEqual(
            typeof query('<foo>')(),
            'function'
        );
    });

    it('allow definitions in a function', () => {
        assert.strictEqual(
            query('map(<$a;$a>)')({ a: 42 }),
            42
        );
    });

    it('body is an empty object', () => {
        assert.deepEqual(
            query('<{}>')()(),
            {}
        );
    });

    it('body is an object with a single key', () => {
        assert.deepEqual(
            query('<{foo:1}>')()(),
            { foo: 1 }
        );
    });

    it('body is an object with a couple keys', () => {
        assert.deepEqual(
            query('<{foo:1,bar:2}>')()(),
            { foo: 1, bar: 2 }
        );
    });

    it('body is an expression', () => {
        assert.strictEqual(
            typeof query('<foo or bar>')(),
            'function'
        );
    });

    it('body is an expression #2', () => {
        assert.strictEqual(
            query('map(<foo ? 1 : 2>)')({ foo: true }),
            1
        );
    });

    it('body is an expression with `>` operator', () => {
        assert.strictEqual(
            typeof query('<(a > b)>')(),
            'function'
        );

        assert.strictEqual(
            query('map(<(a > b)>)')({ a: 1, b: 2 }),
            false
        );

        assert.strictEqual(
            query('map(<(a > b)>)')({ a: 2, b: 1 }),
            true
        );

        assert.deepEqual(
            query('map(<{ test: a.size() > 2 }>)')([{ a: [2, 3] }, { a: [1, 2, 3] }]),
            [{ test: false }, { test: true }]
        );

        assert.deepEqual(
            query('map(<a.[$ > 2]>)')([{ a: [2, 3] }, { a: [1, 5, 2] }]),
            [3, 5]
        );

        assert.deepEqual(
            query('map(<a.($ > 2)>)')([{ a: [2, 3] }, { a: [1, 5, 2] }]),
            [false, true]
        );

        assert.deepEqual(
            query('map(<a..($ > 2)>)')([{ a: [2, 3] }, { a: [1, 5, 2] }]),
            [false, true]
        );

        assert.deepEqual(
            query('map(<a[b > 2]>)')([{ a: { true: 1, false: 2 }, b: 1 }, { a: { true: 3, false: 4 }, b: 3 }]),
            [2, 3]
        );
    });

    it('body is an expression with `<` operator', () => {
        assert.strictEqual(
            typeof query('<a < b>')(),
            'function'
        );

        assert.strictEqual(
            query('map(<a < b>)')({ a: 1, b: 2 }),
            true
        );

        assert.strictEqual(
            query('map(<a < b>)')({ a: 2, b: 1 }),
            false
        );
    });

    it('body is an expression with `<` and `>` operators', () => {
        assert.strictEqual(
            typeof query('<$ < 10 or ($ > 20)>')(),
            'function'
        );
    });

    it('body is an expression with `<` and `>` operators with map()', () => {
        assert.deepEqual(
            [5, 15, 25].map(value => query('map(<$ < 10 or ($ > 20)>)')(value)),
            [true, false, true]
        );
    });

    it('nested functions', () => {
        assert.deepEqual(
            query('map(<<a>>)')([1, 2]).map(value => typeof value),
            ['function', 'function']
        );
    });
});

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
});
