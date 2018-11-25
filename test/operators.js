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
        it('basic', () => {
            assert.deepEqual(
                query('.[type in #]')(data, ['css', 'svg']),
                data
                    .filter(item => item.type === 'css' || item.type === 'svg')
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
                query('.[type not in #]')(data, ['css', 'svg']),
                data
                    .filter(item => item.type !== 'css' && item.type !== 'svg')
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
                query('(1 ? 2 : 3, 0 ? 2 : 3)')(data),
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
