const assert = require('assert');
const query = require('./helpers/lib');

describe('lang/pipeline `e | e`', () => {
    const data = [
        { foo: { bar: 1 } },
        { foo: { bar: 2 } },
        { foo: { bar: 3 } }
    ];

    it('basic', () => {
        assert.deepEqual(
            query('foo | bar')(data),
            [1, 2, 3]
        );
    });

    it('array as current', () => {
        assert.deepEqual(
            query('foo | { len: size(), bar }')(data),
            { len: 3, bar: [1, 2, 3] }
        );
    });

    it('a-la object destruction', () => {
        assert.deepEqual(
            query('{ foo: 1, bar: 41 } | foo + bar')(),
            42
        );
    });

    it('a long pipeline', () => {
        assert.deepEqual(
            query('{ foo: 1, bar: 41 } | entries() | .[value > 5] | fromEntries()')(),
            { bar: 41 }
        );
    });

    it('with definitions', () => {
        assert.deepEqual(
            query('$foo; $foo | $bar; $bar')(data),
            [1, 2, 3]
        );
    });

    it('complex pipeline #1', () => {
        assert.deepEqual(
            query('@ | foo.bar | [::-1]')(data),
            [3, 2, 1]
        );
    });
});
