import assert from 'assert';
import query from 'jora';
import data from '../helpers/fixture.js';

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

        it('should support for regexp flags', () => {
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
                query('$~=/\\.js$/')(['1.js', '2.css', '3.js']),
                true
            );
            assert.strictEqual(
                query('$~=/\\.svg$/')(['1.js', '2.css', '3.js']),
                false
            );
        });

        it('regexp from context', () => {
            assert.strictEqual(
                query('$~=#.rx')('1.js', { rx: /\.js$/ }),
                true
            );
        });

        it('should take a function as tester', () => {
            assert.strictEqual(
                query('$ ~= =>$=123')(123),
                true
            );
            assert.strictEqual(
                query('$ ~= =>$=234')(123),
                false
            );
            assert.strictEqual(
                query('$ ~= #.fn')(234, { fn: val => val === 234}),
                true
            );
            assert.strictEqual(
                query('$ ~= #.fn')(234, { fn: val => val === 123}),
                false
            );
        });

        it('should be always positive when tester is `null`', () => {
            assert.strictEqual(
                query('"foo" ~= null')(),
                true
            );
            assert.strictEqual(
                query('false ~= null')(),
                true
            );
            assert.strictEqual(
                query('null ~= null')(),
                true
            );
            assert.strictEqual(
                query('undefined ~= null')(),
                true
            );
        });

        it('should be always positive when tester is `undefined`', () => {
            assert.strictEqual(
                query('"foo" ~= undefined')(),
                true
            );
            assert.strictEqual(
                query('false ~= undefined')(),
                true
            );
            assert.strictEqual(
                query('null ~= undefined')(),
                true
            );
            assert.strictEqual(
                query('undefined ~= undefined')(),
                true
            );
        });

        it('should be negative when pattern is a string', () => {
            assert.strictEqual(
                query('"41234" ~= "123"')(),
                false
            );
        });

        it('should be negative when pattern is a number', () => {
            assert.strictEqual(
                query('"41234" ~= 123')(),
                false
            );
        });
    });

    for (const operator of ['not', 'no']) {
        describe(operator, () => {
            for (const expr of [
                '0',
                'false',
                'null',
                'undefined',
                'NaN',
                '""',
                '[]',
                '{}'
            ]) {
                it(expr, () => {
                    assert.strictEqual(query(`${operator} ${expr}`)(), true);
                });
            }

            for (const expr of [
                '1',
                'true',
                'Infinity',
                '-Infinity',
                '[1]',
                '[undefined]',
                '{ foo: 1 }',
                '{ foo: undefined }'
            ]) {
                it(expr, () => {
                    assert.strictEqual(query(`${operator} ${expr}`)(), false);
                });
            }
        });
    }

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

        it('should support NaN', () => {
            assert.deepEqual(
                query('$ in [1, NaN]')(NaN),
                true
            );
            assert.deepEqual(
                query('$ not in [1, NaN]')(NaN),
                false
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

        it('should support NaN', () => {
            assert.deepEqual(
                query('[1, NaN] has $')(NaN),
                true
            );
            assert.deepEqual(
                query('[1, NaN] has no $')(NaN),
                false
            );
        });

        it('not a has b', () => {
            assert.deepEqual(
                query('.[not # has type]')(data, ['css', 'svg']),
                data
                    .filter(item => item.type !== 'css' && item.type !== 'svg')
            );
        });

        it('a has no b', () => {
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

    describe('??', () => {
        it('basic', () => {
            assert.strictEqual(
                query('null ?? 42')(),
                42
            );
            assert.strictEqual(
                query('undefined ?? 42')(),
                42
            );
        });

        for (const expr of [
            '0',
            'false',
            '""',
            '{}',
            '[]',
            'NaN'
        ]) {
            it(expr, () => {
                assert.notStrictEqual(
                    query(expr + ' ?? "fail"')(),
                    'fail'
                );
            });
        }

        describe('should work with "or" and "and" operators', () => {
            for (const { expr, expected } of [
                { expr: 'true and null ?? true', expected: true },
                { expr: 'true and true ?? false', expected: true },
                { expr: 'true and null ?? true and 123', expected: 123 },
                { expr: 'false and null ?? true', expected: false },
                { expr: 'null and false ?? true', expected: null },
                { expr: 'true and null ?? false or 42', expected: 42 },
                { expr: 'false or null ?? false and 42', expected: false },
                { expr: 'true or null ?? false', expected: true },
                { expr: 'null or false ?? true', expected: false },
                { expr: 'false or null ?? 42', expected: 42 },
                { expr: 'false or 42 ?? false', expected: 42 },
                { expr: 'false or null ?? 0 or 42', expected: 42 }
            ]) {
                it(expr, () => {
                    assert.strictEqual(
                        query(expr)(),
                        expected
                    );
                });
            }
        });

        it('should not evaluate right expression when left expression is truthy', () => {
            let left = 0;
            let right = 0;
            const value = { foo: 123 };
            const result = query('left ?? right')({
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

        describe('should has a higher precedence compared to the pipeline operator', () => {
            // with higher precedence the query might not be parsed
            const cases = [
                { query: '? (1 | 2) : 0', expected: 2, data: true },
                { query: '? (1 | 2) : 0', expected: 0, data: false },
                { query: '? (1 | 2) : (0 | 3)', expected: 2, data: true },
                { query: '? (1 | 2) : (0 | 3)', expected: 3, data: false },

                { query: 'true  ? (1 | 2) : 0', expected: 2 },
                { query: 'false ? (1 | 2) : 0', expected: 0 },
                { query: 'true  ? (1 | 2) : (0 | 3)', expected: 2 },
                { query: 'false ? (1 | 2) : (0 | 3)', expected: 3 },

                { query: 'true  | ? (1 | 2) : 0', expected: 2 },
                { query: 'false | ? (1 | 2) : 0', expected: 0 },
                { query: 'true  | ? (1 | 2) : (0 | 3)', expected: 2 },
                { query: 'false | ? (1 | 2) : (0 | 3)', expected: 3 },

                // should be treated as { a: 1 } | (2 ? a : 0)
                // for "({ a: 1 } | 2) ? a : 0" returns undefined
                { query: '{ a: 1 } | 2 ? a : 0', expected: 1 }
            ];

            for (const { query: squery, data, expected } of cases) {
                it(squery, () => {
                    assert.deepEqual(
                        query(squery)(data),
                        expected
                    );
                });

                const fquery = squery.replace(/\((\d+\s+\|\s+\d+)\)/g, '$1');
                if (fquery !== squery) {
                    it(squery, () => {
                        assert.throws(() => query(fquery)(data));
                    });
                }
            }
        });

        describe('omit parts', () => {
            const data = { foo: 1, bar: 2 };
            const testcases = [
                { query: '?', expected: data },
                { query: 'true?', expected: data },
                { query: 'true?:', expected: data },
                { query: 'true?:2', expected: data },
                { query: 'true?bar:', expected: 2 },
                { query: 'false?', expected: undefined },
                { query: 'false?:', expected: undefined },
                { query: 'false?1:', expected: undefined },
                { query: 'false?:42', expected: 42 },
                { query: 'false?:foo', expected: 1 }
            ];

            for (const testcase of testcases) {
                it(testcase.query, () => {
                    assert.deepEqual(query(testcase.query)(data), testcase.expected);
                });
            }
        });
    });

    describe('is', () => {
        describe('without expr', () => {
            it('should work', () => {
                assert.strictEqual(query('is number')(123), true);
                assert.strictEqual(query('is (number)')(123), true);
                assert.strictEqual(query('is number')('123'), false);
                assert.strictEqual(query('is (number)')('123'), false);
            });

            it('should work with not', () => {
                assert.strictEqual(query('is not number')(123), false);
                assert.strictEqual(query('is not (number)')(123), false);
                assert.strictEqual(query('is not number')('123'), true);
                assert.strictEqual(query('is not (number)')('123'), true);
            });

            it('should work with var', () => {
                assert.strictEqual(query('$odd: => $ % 2; is $odd')(123), true);
                assert.strictEqual(query('$odd: => $ % 2; is $odd')(124), false);
            });

            it('should work with list of assertions', () => {
                assert.strictEqual(query('$odd: => $ % 2; is (number or $odd)')(123), true);
                assert.strictEqual(query('$odd: => $ % 2; is (number or $odd)')(124), true);
                assert.strictEqual(query('$odd: => $ % 2; is (number or $odd)')('123'), true);
                assert.strictEqual(query('$odd: => $ % 2; is (number or $odd)')('124'), false);
            });

            it('should throw on unknown assertion', () => {
                assert.throws(
                    () => query('is xxx')(123),
                    /Assertion "xxx" is not defined/
                );
            });

            it('should throw on unknown var', () => {
                assert.throws(
                    () => query('is $xxx')(),
                    /\$xxx is not defined/
                );
            });
        });

        describe('with expression', () => {
            it('should work', () => {
                assert.strictEqual(query('123 is number')(), true);
                assert.strictEqual(query('123 is (number)')(), true);
                assert.strictEqual(query('"123" is number')(), false);
                assert.strictEqual(query('"123" is (number)')(), false);
            });

            it('should work with not', () => {
                assert.strictEqual(query('123 is not number')(), false);
                assert.strictEqual(query('123 is not (number)')(), false);
                assert.strictEqual(query('"123" is not number')(), true);
                assert.strictEqual(query('"123"is not (number)')(), true);
            });

            it('should work with var', () => {
                assert.strictEqual(query('$odd: => $ % 2; 123 is $odd')(), true);
                assert.strictEqual(query('$odd: => $ % 2; 124 is $odd')(), false);
            });

            it('should work with list of assertions', () => {
                assert.strictEqual(query('$odd: => $ % 2; 123 is (number or $odd)')(), true);
                assert.strictEqual(query('$odd: => $ % 2; 124 is (number or $odd)')(), true);
                assert.strictEqual(query('$odd: => $ % 2; "123" is (number or $odd)')(), true);
                assert.strictEqual(query('$odd: => $ % 2; "124" is (number or $odd)')(), false);
            });

            it('should throw on unknown assertion', () => {
                assert.throws(
                    () => query('123 is xxx')(),
                    /Assertion "xxx" is not defined/
                );
            });

            it('should throw on unknown var', () => {
                assert.throws(
                    () => query('123 is $xxx')(),
                    /\$xxx is not defined/
                );
            });
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
