import assert from 'assert';
import query from 'jora';

describe('lang/get-property', () => {
    it('should return all values', () => {
        assert.deepEqual(
            query('prop')([
                { prop: 1 },
                { prop: 2 },
                { prop: 3 }
            ]),
            [1, 2, 3]
        );
    });

    it('should not fails when object have no property and should excludes undefines', () => {
        assert.deepEqual(
            query('prop')([
                { },
                { prop: 42 }
            ]),
            [42]
        );
    });

    it('should dedup values', () => {
        assert.deepEqual(
            query('prop')([
                { prop: 'css' },
                { prop: 'js'},
                { prop: 'css' },
                { prop: 'svg' }
            ]),
            ['css', 'js', 'svg']
        );
    });

    it('should return concated arrays', () => {
        assert.deepEqual(
            query('prop')([
                { prop: ['foo', 'bar'] },
                { },
                { prop: undefined },
                { prop: ['baz'] }
            ]),
            ['foo', 'bar', 'baz']
        );
    });

    it('should return an array for chained paths', () => {
        assert.deepEqual(
            query('prop.test')([
                { prop: null },
                { prop: { test: true} },
                { prop: true },
                { prop: { test: [true] }}
            ]),
            [true]
        );
    });

    it('should not fails on unexisted paths', () => {
        assert.deepEqual(
            query('something.does.non.exists')([
                { something: {} },
                {}
            ]),
            []
        );
    });

    it('should allow unicode escapes', () => {
        assert.deepEqual(
            query('\\u0068el\\u006co\\u0020wor\\u006Cd')({ 'hello world': 42 }),
            42
        );
    });

    describe('escape sequences', () => {
        const testcases = [
            { jora: '\\u0068el\\u006cowor\\u006Cd', input: { 'helloworld': 42 }, expected: 42 },
            { jora: '\\u0068el\\u006co\\u0020wor\\u006Cd', input: { 'hello world': 42 }, expected: 42 },
            { jora: '\\u0031foo', input: { '1foo': 2 }, expected: 2 },
            { jora: '\\u0021foo', input: { '!foo': 3 }, expected: 3 },
            { jora: '\\u0020', input: { ' ': 4 }, expected: 4 }
        ];

        for (const { jora, input, expected, error } of testcases) {
            it(jora, error
                ? () => assert.throws(() => query(jora)(input), error)
                : () => assert.deepEqual(query(jora)(input), expected)
            );
        }
    });
});
