import assert from 'assert';
import query from 'jora';

describe('lang/compare function', () => {
    const data = [1, 2, 3, 2, 1, 4].map((value, idx) => ({ idx, foo: value }));

    it('basic asc', () => {
        const fn = query('foo asc')();

        assert(typeof fn === 'function');
        assert.deepEqual(
            data.slice().sort(fn),
            data.slice().sort((a, b) => a.foo - b.foo)
        );
    });

    it('an object as a query with asc', () => {
        const fn = query('{a:1,b:2} asc')();

        assert(typeof fn === 'function');
        assert.deepEqual(
            data.slice().sort(fn),
            data.slice().sort()
        );
    });

    it('basic desc', () => {
        const fn = query('foo desc')();

        assert(typeof fn === 'function');
        assert.deepEqual(
            data.slice().sort(fn),
            data.slice().sort((a, b) => b.foo - a.foo)
        );
    });

    it('an object as a query with desc', () => {
        const fn = query('{a:1,b:2} desc')();

        assert(typeof fn === 'function');
        assert.deepEqual(
            data.slice().sort(fn),
            data.slice().sort()
        );
    });

    it('composite asc/desc', () => {
        const fn = query('foo asc, idx desc')();

        assert(typeof fn === 'function');
        assert.deepEqual(
            data.slice().sort(fn),
            data.slice().sort((a, b) => (a.foo - b.foo) || (b.idx - a.idx))
        );
    });

    it('composite desc/asc', () => {
        const fn = query('foo desc, idx asc')();

        assert(typeof fn === 'function');
        assert.deepEqual(
            data.slice().sort(fn),
            data.slice().sort((a, b) => (b.foo - a.foo) || (a.idx - b.idx))
        );
    });

    it('should allow any expression in a definition', () => {
        const fn = query('1 / foo asc')();

        assert(typeof fn === 'function');
        assert.deepEqual(
            data.slice().sort(fn),
            data.slice().sort((a, b) => (1 / a.foo - 1 / b.foo) || (a.idx - b.idx))
        );
    });

    describe('precedence over other syntax', () => {
        describe('function', () => {
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

        describe('pipeline operator', () => {
            it('single compare', () => {
                const actual = query('foo | bar desc')();

                assert.strictEqual(typeof actual, 'function');
                assert.strictEqual(
                    actual({ foo: { bar: 2 } }, { foo: { bar: 10 } }),
                    1
                );
            });
            it('a compare list', () => {
                const actual = query('[foo | bar desc, baz | qux asc]')();

                assert.strictEqual(actual.length, 1);
                assert.strictEqual(typeof actual[0], 'function');
                assert.strictEqual(actual[0]({ foo: { bar: 2 } }, { foo: { bar: 10 } }), 1);
                assert.strictEqual(actual[0]({ baz: { qux: 2 } }, { baz: { qux: 10 } }), -1);
                assert.strictEqual(actual[0]({ bar: 2 }, { bar: 10 }), 0);
            });
        });
    });
});
