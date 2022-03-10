import assert from 'assert';
import query from 'jora';
import data from './helpers/fixture.js';

describe('lang/operators', () => {
    describe('=', () => {
        it('basic test', () => {
            assert.strictEqual(
                query('$="2.js"')('2.js'),
                true
            );
            assert.strictEqual(
                query('$="2.js"')('4.js'),
                false
            );
        });

        it('should compare scalars as JavaScript\'s === operator', () => {
            assert.strictEqual(
                query('456=456')(),
                true
            );

            assert.strictEqual(
                query('456="456"')(),
                false
            );

            assert.strictEqual(
                query('({}/1)=({}/1)')(),
                true
            );
        });
    });

    describe('!=', () => {
        it('basic test', () => {
            assert.strictEqual(
                query('$!="4.js"')('2.js'),
                true
            );
            assert.strictEqual(
                query('$!="4.js"')('4.js'),
                false
            );
        });

        it('should compare scalars as JavaScript\'s Object.is()', () => {
            assert.strictEqual(
                query('456!=456')(456),
                false
            );

            assert.strictEqual(
                query('456!="456"')(),
                true
            );

            assert.strictEqual(
                query('({}/1)!=({}/1)')(),
                false
            );
        });
    });

    describe('<', () => {
        it('basic test', () => {
            assert.strictEqual(
                query('$<"4.js"')('3.js'),
                true
            );
            assert.strictEqual(
                query('$<"4.js"')('4.js'),
                false
            );
            assert.strictEqual(
                query('$<"4.js"')('5.js'),
                false
            );
        });

        it('should compare scalars as JavaScript\'s < operator', () => {
            assert.strictEqual(
                query('$<500')('456'),
                '456' < 500
            );
            assert.strictEqual(
                query('$<500')('500'),
                '500' < 500
            );
            assert.strictEqual(
                query('$<500')('567'),
                '567' < 500
            );
        });

        it('should has greater precedence than a logical operators', () => {
            assert.strictEqual(
                query('a < 5 or b < 10')({ a: 12, b: 4 }),
                true
            );
        });
    });

    describe('>', () => {
        it('basic test', () => {
            assert.strictEqual(
                query('$>"4.js"')('3.js'),
                false
            );
            assert.strictEqual(
                query('$>"4.js"')('4.js'),
                false
            );
            assert.strictEqual(
                query('$>"4.js"')('5.js'),
                true
            );
        });

        it('should compare scalars as JavaScript\'s > operator', () => {
            assert.strictEqual(
                query('$>500')('456'),
                '456' > 500
            );
            assert.strictEqual(
                query('$>500')('500'),
                '500' > 500
            );
            assert.strictEqual(
                query('$>500')('567'),
                '567' > 500
            );
        });

        it('should has greater precedence than a logical operators', () => {
            assert.strictEqual(
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

    describe('<=', () => {
        it('basic test', () => {
            assert.strictEqual(
                query('$<="4.js"')('3.js'),
                true
            );
            assert.strictEqual(
                query('$<="4.js"')('4.js'),
                true
            );
            assert.strictEqual(
                query('$<="4.js"')('5.js'),
                false
            );
        });

        it('should compare scalars as JavaScript\'s <= operator', () => {
            assert.strictEqual(
                query('$<=500')('456'),
                '456' <= 500
            );
            assert.strictEqual(
                query('$<=500')('500'),
                '500' <= 500
            );
            assert.strictEqual(
                query('$<=500')('567'),
                '567' <= 500
            );
        });
    });

    describe('>=', () => {
        it('basic test', () => {
            assert.strictEqual(
                query('$>="4.js"')('3.js'),
                false
            );
            assert.strictEqual(
                query('$>="4.js"')('4.js'),
                true
            );
            assert.strictEqual(
                query('$>="4.js"')('5.js'),
                true
            );
        });

        it('should compare scalars as JavaScript\'s >= operator', () => {
            assert.strictEqual(
                query('$>=500')('456'),
                '456' >= 500
            );
            assert.strictEqual(
                query('$>=500')('500'),
                '500' >= 500
            );
            assert.strictEqual(
                query('$>=500')('567'),
                '567' >= 500
            );
        });
    });

    describe('~=', () => {
        it('basic test', () => {
            assert.strictEqual(
                query('$~=/\\.js$/')('1.js'),
                true
            );
            assert.strictEqual(
                query('$~=/\\.js$/')('1.css'),
                false
            );
        });

        it('should support for `i` flag', () => {
            assert.strictEqual(
                query('$~=/\\.js$/i')('1.js'),
                true
            );
            assert.strictEqual(
                query('$~=/\\.JS$/i')('1.js'),
                true
            );
            assert.strictEqual(
                query('$~=/\\.js$/i')('1.JS'),
                true
            );
            assert.strictEqual(
                query('$~=/\\.js$/i')('1.css'),
                false
            );
        });

        it('should apply as some() for array', () => {
            assert.strictEqual(
                query('foo~=/\\.js$/')([{ foo: '1.js' }, { foo: '2.css' }, { foo: '3.js' }]),
                true
            );
            assert.strictEqual(
                query('foo~=/\\.svg$/')([{ foo: '1.js' }, { foo: '2.css' }, { foo: '3.js' }]),
                false
            );
        });

        it('regexp from context', () => {
            assert.strictEqual(
                query('$~=#.rx')('1.js', { rx: /\.js$/ }),
                true
            );
        });

        it('issue #2 - regexp shouldn\'t be hungry', () => {
            assert.strictEqual(
                query('foo~=/./ and "a/b" in bar')({ foo: 'abc', bar: 'aaa/bbb' }),
                true
            );
        });

        it('should take a function as tester', () => {
            assert.strictEqual(
                query('$ ~= =>$=123')(123),
                true
            );
            assert.strictEqual(
                query('$ ~= =>$=123')(234),
                false
            );
        });

        it('should be positive when tester is `null`', () => {
            assert.strictEqual(
                query('$ ~= null')('foo'),
                true
            );
            assert.strictEqual(
                query('$ ~= null')(false),
                true
            );
        });

        it('should be positive when tester is `undefined`', () => {
            assert.strictEqual(
                query('$ ~= undefined')('foo'),
                true
            );
            assert.strictEqual(
                query('$ ~= undefined')(false),
                true
            );
        });

        it('should be negative when pattern is a string', () => {
            assert.strictEqual(
                query('$ ~= "123"')('41234'),
                false
            );
        });

        it('should be negative when pattern is a number', () => {
            assert.strictEqual(
                query('$ ~= 123')('41234'),
                false
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

        it('should not evaluate right expression when left expression is truthy', () => {
            let left = 0;
            let right = 0;
            const value = { foo: 123 };
            const result = query('left or right')({
                get left() {
                    left++;
                    return value;
                },
                get right() {
                    right++;
                    return true;
                }
            });

            assert.strictEqual(result, value, 'should return truthy expression result as is');
            assert.strictEqual(left, 1, 'should evaluate left expression once');
            assert.strictEqual(right, 0, 'should not evaluate right expression');
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

        it('should not evaluate right expression when left expression is falsy', () => {
            let left = 0;
            let right = 0;
            const value = {};
            const result = query('left and right')({
                get left() {
                    left++;
                    return value;
                },
                get right() {
                    right++;
                    return true;
                }
            });

            assert.strictEqual(result, value, 'should return falsy expression result as is');
            assert.strictEqual(left, 1, 'should evaluate left expression once');
            assert.strictEqual(right, 0, 'should not evaluate right expression');
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
            assert.deepEqual(
                query('.[$=457+1]')([455, 456, 457, 458]),
                [458]
            );
        });

        it('should concat arrays', () => {
            assert.deepEqual(
                query('a+b')({ a: [1, 2], b: [3, 4] }),
                [1, 2, 3, 4]
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
                query('a+b')({ a: [{ a: 1 }, { b: 2 }], b: { c: 3 } }),
                [{ a: 1 }, { b: 2 }, { c: 3 }]
            );
        });

        it('should add a scalar to array', () => {
            assert.deepEqual(
                query('a+b')({ a: ['css', 'js', 'svg'], b: 'foo' }),
                ['css', 'js', 'svg', 'foo']
            );
        });

        it('should not mutate original arrays', () => {
            const data = [1, 2, 3];

            assert.deepEqual(
                query('a+b')({ a: data, b: 'bar' }),
                data.concat('bar')
            );
            assert.equal(data.length, 3);
        });
    });

    describe('-', () => {
        it('basic', () => {
            assert.deepEqual(
                query('.[$=457-1]')([455, 456, 457, 458]),
                [456]
            );
        });

        it('should filter an array', () => {
            const a = [1, 2, 3, 4];
            const b = [2, 4];
            assert.deepEqual(
                query('a-b')({ a, b }),
                [1, 3]
            );
        });

        it('should filter an object', () => {
            const data = [{ a: 1 }, { b: 2 }, { c: 3 }];
            assert.deepEqual(
                query('a-b')({ a: data, b: data[0] }),
                data.slice(1)
            );
        });

        it('should filter a scalar', () => {
            assert.deepEqual(
                query('a-b')({ a: ['css', 'js', 'svg'], b: 'js' }),
                ['css', 'svg']
            );
        });

        it('should dedup', () => {
            const a = [1, 2, 1, 3, 1];
            assert.deepEqual(
                query('a-b')({ a, b: [2, 3] }),
                [1]
            );
            assert.deepEqual(
                query('a-b')({ a, b: 2 }),
                [1, 3]
            );
        });
    });

    describe('*', () => {
        it('basic', () => {
            assert.equal(
                query('6*8')(),
                48
            );

            assert.equal(
                query('6 * 8')(),
                48
            );
        });
    });

    describe('/', () => {
        it('basic', () => {
            assert.equal(
                query('48/8')(),
                6
            );

            assert.equal(
                query('48 / 8')(),
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
                query('42%10')(),
                2
            );

            assert.equal(
                query('42 % 10')(),
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
