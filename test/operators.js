const assert = require('assert');
const data = require('./fixture/simple');
const query = require('../src');

describe('operators', () => {
    describe('=', () => {
        it('basic test', () => {
            assert.deepEqual(
                query('.[filename="2.js"]')(data),
                data
                    .filter(item => item.filename === '2.js')
            );
        });

        it('should compare scalars as JavaScript\'s === operator', () => {
            assert.deepEqual(
                query('.[uniqueNumber=456]')(data),
                data
                    .filter(item => item.uniqueNumber === 456)
            );

            assert.deepEqual(
                query('.[uniqueNumber="456"]')(data),
                data
                    .filter(item => item.uniqueNumber === '456')
            );
        });
    });

    describe('!=', () => {
        it('basic test', () => {
            assert.deepEqual(
                query('.[filename!="2.js"]')(data),
                data
                    .filter(item => item.filename !== '2.js')
            );
        });

        it('should compare scalars as JavaScript\'s !== operator', () => {
            assert.deepEqual(
                query('.[uniqueNumber!=456]')(data),
                data
                    .filter(item => item.uniqueNumber !== 456)
            );

            assert.deepEqual(
                query('.[uniqueNumber!="456"]')(data),
                data
                    .filter(item => item.uniqueNumber !== '456')
            );
        });
    });

    describe('<', () => {
        it('basic test', () => {
            assert.deepEqual(
                query('.[filename<"4.js"]')(data),
                data
                    .filter(item => item.filename < '4.js')
            );
        });

        it('should compare scalars as JavaScript\'s < operator', () => {
            assert.deepEqual(
                query('.[uniqueNumber<500]')(data),
                data
                    .filter(item => item.uniqueNumber < 500)
            );
        });

        it('should has greater precedence than a logical operators', () => {
            assert.deepEqual(
                query('a < 5 or b < 10')({ a: 12, b: 4 }),
                true
            );
        });
    });

    describe('<=', () => {
        it('basic test', () => {
            assert.deepEqual(
                query('.[filename<="4.js"]')(data),
                data
                    .filter(item => item.filename <= '4.js')
            );
        });

        it('should compare scalars as JavaScript\'s <= operator', () => {
            assert.deepEqual(
                query('.[uniqueNumber<=456]')(data),
                data
                    .filter(item => item.uniqueNumber <= 456)
            );
        });
    });

    describe('>', () => {
        it('basic test', () => {
            assert.deepEqual(
                query('.[filename>"4.js"]')(data),
                data
                    .filter(item => item.filename > '4.js')
            );
        });

        it('should compare scalars as JavaScript\'s > operator', () => {
            assert.deepEqual(
                query('.[uniqueNumber>400]')(data),
                data
                    .filter(item => item.uniqueNumber > 400)
            );
        });

        it('should has greater precedence than a logical operators', () => {
            assert.equal(
                query('a > 5 or b > 10')({ a: 4, b: 12 }),
                true
            );
        });
    });

    describe('a pair or `<` and `>`', () => {
        it('inside a range', () => {
            assert.deepEqual(
                [0, 10, 20].map(value => query('$ > 5 and $ < 15')(value)),
                [false, true, false]
            );
        });

        it('outside a range', () => {
            assert.deepEqual(
                [0, 10, 20].map(value => query('$ < 5 or $ > 15')(value)),
                [true, false, true]
            );
        });
    });

    describe('>=', () => {
        it('basic test', () => {
            assert.deepEqual(
                query('.[filename>="4.js"]')(data),
                data
                    .filter(item => item.filename >= '4.js')
            );
        });

        it('should compare scalars as JavaScript\'s >= operator', () => {
            assert.deepEqual(
                query('.[uniqueNumber>=456]')(data),
                data
                    .filter(item => item.uniqueNumber >= 456)
            );
        });
    });

    describe('~=', () => {
        it('basic test', () => {
            assert.deepEqual(
                query('.[filename~=/\\.js$/]')(data),
                data
                    .filter(item => /\.js$/.test(item.filename))
            );
        });

        it('should support for `i` flag', () => {
            assert.deepEqual(
                query('.[filename~=/\\.JS$/i]')(data),
                data
                    .filter(item => /\.JS$/i.test(item.filename))
            );
        });

        it('should apply as a filter for array', () => {
            assert.deepEqual(
                query('filename~=/\\.js$/')(data),
                data
                    .map(item => item.filename)
                    .filter(item => /\.js$/.test(item))
            );
        });

        it('regexp can be fetched by get request', () => {
            assert.deepEqual(
                query('filename~=#.rx')(data, { rx: /\.js$/ }),
                data
                    .map(item => item.filename)
                    .filter(item => /\.js$/.test(item))
            );
        });

        it('issue #2 - regexp shouldn\'t be hungry', () => {
            assert.deepEqual(
                query('.[filename~=/./ and "a/b" in refs]')(data),
                []
            );
        });
    });

    describe('not', () => {
        it('basic', () => {
            assert.deepEqual(
                query('.[not errors]')(data),
                data
                    .filter(item => !item.errors || !item.errors.length)
            );

            assert.deepEqual(
                query('.[not type="css"]')(data),
                query('.[type!="css"]')(data)
            );
        });

        it('should support alias `no`', () => {
            assert.deepEqual(
                query('.[no errors]')(data),
                data
                    .filter(item => !item.errors || !item.errors.length)
            );
        });
    });

    describe('in', () => {
        it('basic usage with an array', () => {
            assert.deepEqual(
                query('.[$ in #]')(['foo', 'bar', 'baz'], ['foo', 'baz', 'qux']),
                ['foo', 'baz']
            );
        });

        it('basic usage with an object', () => {
            assert.deepEqual(
                query('.[$ in #]')(['foo', 'bar', 'baz'], { foo: 1, baz: undefined, qux: 2 }),
                ['foo', 'baz']
            );
        });

        it('basic usage with a string', () => {
            assert.deepEqual(
                query('.[$ in #]')(['foo', 'bar', 'baz'], 'foobaz'),
                ['foo', 'baz']
            );
        });

        it('not a in b', () => {
            assert.deepEqual(
                query('.[not type in #]')(data, ['css', 'svg']),
                data
                    .filter(item => item.type !== 'css' && item.type !== 'svg')
            );
        });

        it('a not in b', () => {
            assert.deepEqual(
                query('.[$ not in #]')(['foo', 'bar', 'baz'], ['foo', 'baz', 'qux']),
                ['bar']
            );

            assert.deepEqual(
                query('.[$ not in #]')(['foo', 'bar', 'baz'], { foo: 1, baz: undefined, qux: 2 }),
                ['bar']
            );

            assert.deepEqual(
                query('.[$ not in #]')(['foo', 'bar', 'baz'], 'foobaz'),
                ['bar']
            );
        });
    });

    describe('has', () => {
        it('basic usage with an array', () => {
            assert.deepEqual(
                query('.[# has $]')(['foo', 'bar', 'baz'], ['foo', 'baz', 'qux']),
                ['foo', 'baz']
            );
        });

        it('basic usage with an object', () => {
            assert.deepEqual(
                query('.[# has $]')(['foo', 'bar', 'baz'], { foo: 1, baz: undefined, qux: 2 }),
                ['foo', 'baz']
            );
        });

        it('basic usage with a string', () => {
            assert.deepEqual(
                query('.[# has $]')(['foo', 'bar', 'baz'], 'foobaz'),
                ['foo', 'baz']
            );
        });

        it('not a has b', () => {
            assert.deepEqual(
                query('.[not # has type]')(data, ['css', 'svg']),
                data
                    .filter(item => item.type !== 'css' && item.type !== 'svg')
            );
        });

        it('a has not b', () => {
            assert.deepEqual(
                query('.[# has no $]')(['foo', 'bar', 'baz'], ['foo', 'baz', 'qux']),
                ['bar']
            );

            assert.deepEqual(
                query('.[# has no $]')(['foo', 'bar', 'baz'], { foo: 1, baz: undefined, qux: 2 }),
                ['bar']
            );

            assert.deepEqual(
                query('.[# has no $]')(['foo', 'bar', 'baz'], 'foobaz'),
                ['bar']
            );
        });
    });

    describe('or', () => {
        it('basic', () => {
            assert.deepEqual(
                query('.[type="css" or type="svg"]')(data),
                data
                    .filter(item => item.type === 'css' || item.type === 'svg')
            );
        });

        it('should process arrays as a bool', () => {
            assert.deepEqual(
                query('.[errors or unique]')(data),
                data
                    .filter(item => (item.errors && item.errors.length) || item.unique)
            );
        });

        it('should has lower precedence than `not`', () => {
            assert.deepEqual(
                query('.[not errors or unique]')(data),
                data
                    .filter(item => !(item.errors && item.errors.length) || item.unique)
            );
        });
    });

    describe('and', () => {
        it('basic', () => {
            assert.deepEqual(
                query('.[type="css" and type="svg"]')(data),
                data
                    .filter(item => item.type === 'css' && item.type === 'svg')
            );
        });

        it('should process arrays as a bool', () => {
            assert.deepEqual(
                query('.[errors and type="js"]')(data),
                data
                    .filter(item => (item.errors && item.errors.length) && item.type === 'js')
            );
        });

        it('should has lower precedence than `not`', () => {
            assert.deepEqual(
                query('.[not errors and type="js"]')(data),
                data
                    .filter(item => !(item.errors && item.errors.length) && item.type === 'js')
            );
        });
    });

    describe('?:', () => {
        it('basic', () => {
            assert.deepEqual(
                query('1 ? 42 : 3')(data),
                42
            );

            assert.deepEqual(
                query('0 ? 2 : 42')(data),
                42
            );

            assert.deepEqual(
                query('[] ? 2 : 42')(data),
                42
            );

            assert.deepEqual(
                query('{} ? 2 : 42')(data),
                42
            );
        });

        it('nested', () => {
            assert.deepEqual(
                query('.($="foo" ? 1 : $="bar" ? 2 : 3)')(['foo', 'bar', 'baz']),
                [1, 2, 3]
            );
        });

        it('nested 2', () => {
            assert.deepEqual(
                query('.($="foo" ? $="bar" ? 1 : 2 : 3)')(['foo', 'bar', 'baz']),
                [2, 3]
            );
        });

        it('should process arrays as a bool', () => {
            assert.deepEqual(
                query('.[errors ? type="js" : false]')(data),
                data
                    .filter(item => (item.errors && item.errors.length) && item.type === 'js')
            );
        });

        it('should has lower precedence than `not`', () => {
            assert.deepEqual(
                query('.[not errors ? type="js" : false]')(data),
                data
                    .filter(item => !(item.errors && item.errors.length) && item.type === 'js')
            );
        });
    });

    describe('+', () => {
        it('basic', () => {
            const expected = data.filter(item => item.uniqueNumber === 456);

            assert.equal(expected.length, 1);
            assert.deepEqual(
                query('.[uniqueNumber=455+1]')(data),
                expected
            );
        });

        it('should concat arrays', () => {
            assert.deepEqual(
                query('.[type="js"]+.[type="css"]')(data),
                data
                    .filter(item => item.type === 'js')
                    .concat(
                        data
                            .filter(item => item.type === 'css')
                    )
            );
        });

        it('should be unique set of items in concated arrays', () => {
            assert.deepEqual(
                query('.[type="js"]+.[type="js" and errors]')(data),
                [...new Set(
                    data
                        .filter(item => item.type === 'js')
                        .concat(
                            data
                                .filter(item => item.type === 'js' && item.errors && item.errors.length)
                        )
                )]
            );
        });

        it('should add an object to array', () => {
            assert.deepEqual(
                query('.[type="js"]+#')(data, data[0]),
                data
                    .filter(item => item.type === 'js')
                    .concat(data[0])
            );
        });

        it('should add a scalar to array', () => {
            assert.deepEqual(
                query('type+#')(data, 'foo'),
                ['css', 'js', 'svg', 'foo']
            );
        });

        it('should not mutate original arrays', () => {
            const len = data.length;

            assert.deepEqual(
                query('@+#')(data, 'bar'),
                data.concat('bar')
            );
            assert.equal(data.length, len);
        });
    });

    describe('-', () => {
        it('basic', () => {
            const expected = data.filter(item => item.uniqueNumber === 456);

            assert.equal(expected.length, 1);
            assert.deepEqual(
                query('.[uniqueNumber=457-1]')(data),
                expected
            );
        });

        it('should filter an array', () => {
            assert.deepEqual(
                query('.[type="js"]-.[errors]')(data),
                query('.[type="js" and no errors]')(data)
            );
        });

        it('should filter an object', () => {
            assert.deepEqual(
                query('.[type="css"]-#')(data, data[0]),
                data
                    .filter(item => item.type === 'css' && item !== data[0])
            );
        });

        it('should filter a scalar', () => {
            assert.deepEqual(
                query('type-"js"')(data),
                query('type.[$!="js"]')(data)
            );
        });
    });

    describe('*', () => {
        it('basic', () => {
            assert.equal(
                query('6*8')(data),
                48
            );

            assert.equal(
                query('6 * 8')(data),
                48
            );
        });
    });

    describe('/', () => {
        it('basic', () => {
            assert.equal(
                query('48/8')(data),
                6
            );

            assert.equal(
                query('48 / 8')(data),
                6
            );
        });

        describe('interference with regexp', () => {
            [
                '(8 / 2) + (16 / 4)',
                '(8 / 2) +\n(16 / 4)',
                '(32) / (16 / 4)',
                '32 / 2 / 2',
                'foo / 2 / 2',
                'bar["baz"] / 2 / 2'
            ].forEach(queryString => {
                it(queryString, () => {
                    assert.equal(
                        query(queryString)({ foo: 32, bar: { baz: 32 } }),
                        8
                    );
                });
            });
        });
    });

    describe('%', () => {
        it('basic', () => {
            assert.equal(
                query('42%10')(data),
                2
            );

            assert.equal(
                query('42 % 10')(data),
                2
            );
        });
    });

    describe('optional spaces around', () => {
        const operators = [
            '=',
            '!=',
            '<',
            '<=',
            '>',
            '>=',
            '~=',
            '+',
            '-'
        ];

        operators.forEach(op =>
            it(op, () => {
                const value = op === '~=' ? '/./' : '"4.js"';
                assert.deepEqual(
                    query(`.[filename ${op} ${value}]`)(data),
                    query(`.[filename${op}${value}]`)(data)
                );
            })
        );
    });
});
