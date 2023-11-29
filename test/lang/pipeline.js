import assert from 'assert';
import query from 'jora';

describe('lang/pipeline', () => {
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

    it('can start a query', () => {
        assert.deepEqual(
            query('| 42')(),
            42
        );
    });

    it('can start a query', () => {
        assert.deepEqual(
            query('| foo')({ foo: 42 }),
            42
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

    it('complex pipeline #2', () => {
        assert.deepEqual(
            query('foo ? (1 | $a: $; 2 + $a) : 0')(data),
            3
        );
    });

    it('complex pipeline #3', () => {
        assert.deepEqual(
            query('"str" | 0 or 1 | $ ? $ : "fail"')(data),
            1
        );
    });

    it('complex pipeline #4', () => {
        assert.deepEqual(
            query('{ id: 1, next: { id: 2, next: { id: 3 }} } | $ + ..next | $[=>id = 3]')(),
            { id: 3 }
        );
    });

    it('complex pipeline #5', () => {
        assert.strictEqual(
            query('| 1 ? 2 : 3 | $')(),
            2
        );
    });
});
