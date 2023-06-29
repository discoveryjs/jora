import assert from 'assert';
import query from 'jora';

describe('replace()', () => {
    describe('array', () => {
        it('any value pattern', () => {
            assert.deepStrictEqual(
                query('replace(0, "test")')([1, 2, 0, 3, 4, 0, 5]),
                [1, 2, 'test', 3, 4, 'test', 5]
            );
        });

        it('NaN as a pattern', () => {
            assert.deepStrictEqual(
                query('replace(NaN, "test")')([1, 2, NaN, 3, 4, NaN, 5]),
                [1, 2, 'test', 3, 4, 'test', 5]
            );
        });

        it('undefined as a pattern', () => {
            assert.deepStrictEqual(
                query('replace(undefined, "test")')([1, 2, undefined, 3, 4, undefined, 5]),
                [1, 2, 'test', 3, 4, 'test', 5]
            );
        });

        it('function as a pattern', () => {
            assert.deepStrictEqual(
                query('replace(=> $ % 2, "test")')([1, 2, 3, 4, 5]),
                ['test', 2, 'test', 4, 'test']
            );
        });

        it('no replacement', () => {
            assert.deepStrictEqual(
                query('replace(=> $ % 2)')([1, 2, 3, 4, 5]),
                [undefined, 2, undefined, 4, undefined]
            );
        });

        it('function as a replacement', () => {
            assert.deepStrictEqual(
                query('replace(=> $ % 2, => $ + 100)')([1, 2, 3, 4, 5]),
                [101, 2, 103, 4, 105]
            );
        });
    });

    describe('any other values', () => {
        it('non-string value', () => {
            assert.strictEqual(
                query('replace("34", "..")')(123456),
                '12..56'
            );
        });

        it('string pattern', () => {
            assert.strictEqual(
                query('replace("a", "b")')('asdasd'),
                'bsdbsd'
            );
        });

        it('regexp pattern', () => {
            assert.strictEqual(
                query('replace(/a/, "b")')('asdasd'),
                'bsdbsd'
            );
        });

        it('non-string and non-regexp pattern', () => {
            assert.strictEqual(
                query('replace(1, "b")')('1asd1asd'),
                'basdbasd'
            );
        });

        it('no replacement', () => {
            assert.strictEqual(
                query('replace("a")')('asdasd'),
                'undefinedsdundefinedsd'
            );
        });

        it('patterns in a replacement string', () => {
            assert.strictEqual(
                query('replace(/a(sd?)/, "$1a")')('asdasd'),
                'sdasda'
            );
        });

        it('function as a replacement', () => {
            assert.strictEqual(
                query('replace(/a(s(?<num>\\d+)?)/, #.stringify)')('as1as', { stringify: JSON.stringify }),
                '{"matched":["as1","s1","1"],"start":0,"end":3,"input":"as1as","groups":{"num":"1"}}' +
                '{"matched":["as","s",null],"start":3,"end":5,"input":"as1as","groups":{}}'
            );
        });

        it('other values as a replacement', () => {
            assert.strictEqual(
                query('replace("a", 1)')('asdasd'),
                '1sd1sd'
            );
        });
    });
});
