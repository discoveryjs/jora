const assert = require('assert');
const query = require('./helpers/lib');

describe('lang/sorting function', () => {
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
});
