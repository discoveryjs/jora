const assert = require('assert');
const data = require('./fixture/simple');
const query = require('../src');

function addUnique(arr, items) {
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (arr.indexOf(item) === -1) {
            arr.push(item);
        }
    }

    return arr;
}

describe('syntax test', () => {
    describe('primitives', () => {
        it('a number', () => {
            assert.strictEqual(
                query('123')(data),
                123
            );
        });

        it('a string', () => {
            assert.strictEqual(
                query('"string"')(data),
                'string'
            );

            assert.strictEqual(
                query('"str\\"ing"')(data),
                'str"ing'
            );
        });

        it('a regexp', () => {
            assert.deepEqual(
                query('/foo/')(data),
                /foo/
            );

            assert.deepEqual(
                query('/foo/i')(data),
                /foo/i
            );
        });

        it('a function', () => {
            assert.strictEqual(
                query('<foo>')(data).toString(),
                '(current) => fn.get(current, "foo")'
            );
        });

        describe('an object', () => {
            it('empty object', () => {
                assert.deepEqual(
                    query('{}')(),
                    {}
                );
            });

            it('single property object', () => {
                assert.deepEqual(
                    query('{ foo: 1 }')(),
                    { foo: 1 }
                );
            });

            it('complex', () => {
                assert.deepEqual(
                    query('{ foo: 1, bar: "asd", data: $ }')(data),
                    { foo: 1, bar: 'asd', data }
                );
            });

            it('spread object', () => {
                assert.deepEqual(
                    query('{ foo: 1, ...@ }')(data[1]),
                    Object.assign({ foo: 1 }, data[1])
                );
            });

            it('... is an alias for ...$', () => {
                assert.deepEqual(
                    query('{ foo: 1, ...,  baz: 3 }')({ foo: 2, bar: 2 }),
                    query('{ foo: 1, ...$, baz: 3 }')({ foo: 2, bar: 2 })
                );

                assert.deepEqual(
                    query('{ foo: 1, ...,  baz: 3 }')({ foo: 2, bar: 2 }),
                    Object.assign({ foo: 1 }, { foo: 2, bar: 2 }, { baz: 3 })
                );
            });
        });
    });

    describe('query roots', () => {
        it('should return <data> when query is empty', () => {
            assert.deepEqual(
                query('')(data),
                data
            );
        });

        it('should refer to <data> when @ is using', () => {
            assert.deepEqual(
                query('@')(data),
                data
            );
        });

        it('should refer to <subject> when # is using', () => {
            assert.deepEqual(
                query('#')(data, data[0]),
                data[0]
            );
        });

        it('a symbol can be a data root (alias to $.symbol)', () => {
            assert.deepEqual(
                query('errors')(data),
                query('$.errors')(data)
            );
        });

        it('an object can be a data root', () => {
            assert.deepEqual(
                query('{ foo: 1 }.({ foo: foo > 0 })')(data),
                { foo: true}
            );
        });
    });

    describe('path', () => {
        it('should return all values', () => {
            assert.deepEqual(
                query('filename')(data),
                data
                    .map(item => item.filename)
            );
        });

        it('should not fails when object have no property and should excludes undefines', () => {
            assert.deepEqual(
                query('unique')(data),
                data
                    .map(item => item.unique)
                    .filter(item => item !== undefined)
            );
        });

        it('should return an array of unique values', () => {
            assert.deepEqual(
                query('type')(data),
                ['css', 'js', 'svg']
            );
        });

        it('should return concated arrays', () => {
            assert.deepEqual(
                query('errors')(data),
                data
                    .reduce((res, item) => res.concat(item.errors || []), [])
            );
        });

        it('should return an array for chained paths', () => {
            assert.deepEqual(
                query('refs.broken')(data),
                [true]
            );
        });

        it('should not fails on unexisted paths', () => {
            assert.deepEqual(
                query('something.does.non.exists')(data),
                []
            );
        });

        it('should allow escaped symbols in paths', () => {
            assert.deepEqual(
                query('something.does.\'not\'.exists')(data),
                []
            );

            assert.deepEqual(
                query('\'\\\'"\'')(data),
                ['a key with special chars']
            );
        });

        it('should allow expressions in parentheses', () => {
            assert.deepEqual(
                query('.(deps + dependants).filename')(data).sort(),
                [...new Set(
                    data
                        .reduce((res, item) => res.concat(item.deps, item.dependants), [])
                        .map(item => item.filename)
                )].sort()
            );
        });

        it('should allow expressions in parentheses as subquery', () => {
            assert.deepEqual(
                query('errors.owner.($ + deps + dependants).filename')(data).sort(),
                [...new Set(
                    data
                        .reduce((res, item) => res.concat(item.errors.map(item => item.owner)), [])
                        .reduce((res, item) => res.concat(item, item.deps, item.dependants), [])
                        .map(item => item.filename)
                )].sort()
            );
        });

        it('should work as a map', () => {
            assert.deepEqual(
                query('.({ filename, deps: deps.size() })')(data),
                data
                    .map(item => ({
                        filename: item.filename,
                        deps: item.deps.length
                    }))
            );
        });
    });

    describe('recursive path', () => {
        it('should collect a subtree', () => {
            const subject = data[5];
            const expected = addUnique([], subject.deps);

            for (let i = 0; i < expected.length; i++) {
                addUnique(expected, expected[i].deps);
            }

            assert.deepEqual(
                query('#..deps.filename')(data, subject).sort(),
                expected
                    .map(item => item.filename)
                    .sort()
            );
        });

        it('should allow queries in parentheses', () => {
            const subject = data[5];
            const expected = [];
            subject.dependants.forEach(item => addUnique(expected, item.deps));

            for (let i = 0; i < expected.length; i++) {
                expected[i].dependants.forEach(item => addUnique(expected, item.deps));
            }

            // build dependants deps cluster
            assert.deepEqual(
                query('#..(dependants.deps).filename')(data, subject).sort(),
                expected
                    .map(item => item.filename)
                    .sort()
            );
        });

        it('should allow expressions in parentheses', () => {
            const subject = data[5];
            const expected = [];
            addUnique(expected, subject.deps);
            addUnique(expected, subject.dependants);

            for (let i = 0; i < expected.length; i++) {
                addUnique(expected, expected[i].deps);
                addUnique(expected, expected[i].dependants);
            }

            // build a dependancy cluster
            assert.deepEqual(
                query('#..(deps + dependants).filename')(data, subject).sort(),
                expected
                    .map(item => item.filename)
                    .sort()
            );
        });

        it('should allow to be a subquery', () => {
            const expected = [];

            data.forEach(item =>
                item.errors
                    .map(error => error.owner)
                    .forEach(item => addUnique(expected, item.deps))
            );

            for (let i = 0; i < expected.length; i++) {
                addUnique(expected, expected[i].deps);
            }

            assert.deepEqual(
                query('errors.owner..deps.filename')(data).sort(),
                expected
                    .map(item => item.filename)
                    .sort()
            );
        });

        it('should allow expressions as a subquery', () => {
            const expected = [];

            data.forEach(item =>
                item.errors
                    .map(error => error.owner)
                    .forEach(item => {
                        addUnique(expected, item.deps);
                        addUnique(expected, item.dependants);
                    })
            );

            for (let i = 0; i < expected.length; i++) {
                addUnique(expected, expected[i].deps);
                addUnique(expected, expected[i].dependants);
            }

            assert.deepEqual(
                query('errors.owner..(deps + dependants).filename')(data).sort(),
                expected
                    .map(item => item.filename)
                    .sort()
            );
        });

        it('include subject to a result', () => {
            const subject = data[5];
            const expected = addUnique([subject], subject.deps);

            for (let i = 0; i < expected.length; i++) {
                addUnique(expected, expected[i].deps);
            }

            assert.deepEqual(
                query('(# + #..deps).filename')(data, subject).sort(),
                expected
                    .map(item => item.filename)
                    .sort()
            );
        });
    });

    describe('filter', () => {
        it('should filter a current array', () => {
            assert.deepEqual(
                query('[type="js"]')(data),
                data
                    .filter(item => item.type === 'js')
            );
        });

        it('should treat empty arrays as false in filter', () => {
            assert.deepEqual(
                query('[errors]')(data),
                data
                    .filter(item => item.errors && item.errors.length)
            );
        });

        it('should treat empty objects as false in filter', () => {
            assert.deepEqual(
                query('[deps]')(data),
                data
                    .filter(item => item.deps && Object.keys(item.deps).length > 0)
            );
        });

        it('should allow following filters', () => {
            assert.deepEqual(
                query('[deps][type="js"]')(data),
                data
                    .filter(item => item.deps && Object.keys(item.deps).length > 0)
                    .filter(item => item.type === 'js')
            );
        });

        it('should allow path before filter', () => {
            assert.deepEqual(
                query('refs[broken]')(data),
                data
                    .reduce((res, item) => res.concat(item.refs || []), [])
                    .filter(item => item.broken)
            );
        });

        it('should allow following path', () => {
            assert.deepEqual(
                query('[deps].type')(data),
                [...new Set(
                    data
                        .filter(item => item.deps && Object.keys(item.deps).length > 0)
                        .map(item => item.type)
                )]
            );

            assert.deepEqual(
                query('[no deps].errors.owner.type')(data),
                ['js']
            );
        });

        it('should use current for $', () => {
            assert.deepEqual(
                query('filename[$="2.js"]')(data),
                data
                    .map(item => item.filename)
                    .filter(item => item === '2.js')
            );

            assert.deepEqual(
                query('errors.owner[type="css"]')(data),
                [data[6]]
            );
        });

        it('path before and after', () => {
            assert.deepEqual(
                query('errors.owner[type="css"].type')(data),
                ['css']
            );
        });

        it('should use subject for #', () => {
            assert.deepEqual(
                query('[$=#]')(data, data[1]),
                data
                    .filter(item => item === data[1])
            );
        });

        it('should use data for @', () => {
            assert.deepEqual(
                query('[$ in @.errors.owner].filename')(data),
                data
                    .reduce((res, item) => res.concat(item.errors.map(item => item.owner)), [])
                    .map(item => item.filename)
            );
        });

        it('optional whitespaces inside brackets', () => {
            assert.deepEqual(
                query('[ errors ]')(data),
                data
                    .filter(item => item.errors && item.errors.length)
            );
        });

        it('should allow to use on separate line', () => {
            assert.deepEqual(
                query('errors.owner\n[type="css"]\n.type')(data),
                ['css']
            );
        });
    });

    describe('method', () => {
        function createExtraFn() {
            const calls = [];
            return {
                calls,
                log: function() {
                    calls.push([...arguments]);
                }
            };
        }

        it('should be called', () => {
            const extra = createExtraFn();

            query('log()', extra)(data);
            assert.deepEqual(
                extra.calls,
                [[data]]
            );
        });

        it('should be called when started with dot', () => {
            const extra = createExtraFn();

            query('.log()', extra)(data);
            assert.deepEqual(
                extra.calls,
                [[data]]
            );
        });

        it('should be called with precending query', () => {
            const extra = createExtraFn();

            query('filename.log()', extra)(data);
            assert.deepEqual(
                extra.calls,
                [[data.map(item => item.filename)]]
            );
        });

        it('should be called for each item when using in parentheses', () => {
            const extra = createExtraFn();

            query('filename.(log())', extra)(data);
            assert.deepEqual(
                extra.calls,
                data.map(item => [item.filename])
            );
        });

        it('should accept params', () => {
            const extra = createExtraFn();

            query('[filename="1.css"].(log(1, 2, 3))', extra)(data);
            assert.deepEqual(
                extra.calls,
                [[data[0], 1, 2, 3]]
            );
        });

        it('should resolve params to current', () => {
            const extra = createExtraFn();

            query('.log(filename)', extra)(data);
            assert.deepEqual(
                extra.calls,
                [[data, data.map(item => item.filename)]]
            );
        });

        it('should resolve params to current inside a parentheses', () => {
            const extra = createExtraFn();

            query('.(log(filename))', extra)(data);
            assert.deepEqual(
                extra.calls,
                data.map(item => [item, item.filename])
            );
        });

        it('should not call a method in map when undefined on object path', () => {
            const extra = createExtraFn();

            query('dontexists.(log())', extra)({});
            assert.deepEqual(
                extra.calls,
                []
            );
        });

        describe('buildin methods', () => {
            describe('bool()', () => {
                it('basic', () => {
                    assert.equal(
                        query('bool()')(data),
                        true
                    );
                });

                it('should return false for empty arrays', () => {
                    assert.equal(
                        query('[foo].bool()')(data),
                        false
                    );
                    assert.deepEqual(
                        query('().bool()')(data),
                        false
                    );
                });

                it('should return false for empty objects', () => {
                    assert.equal(
                        query('bool()')({}),
                        false
                    );
                    assert.deepEqual(
                        query('bool()')({ foo: 1}),
                        true
                    );
                    assert.equal(
                        query('{}.bool()')(),
                        false
                    );
                    assert.equal(
                        query('{ foo: 1 }.bool()')(),
                        true
                    );
                });
            });

            describe('size()', () => {
                it('basic', () => {
                    assert.equal(
                        query('size()')(data),
                        data.length
                    );
                });

                it('in subquery', () => {
                    assert.deepEqual(
                        query('.(deps.size())')(data).sort(),
                        [0, 1, 2]
                    );
                });

                it('should return a zero for values with no length', () => {
                    assert.equal(
                        query('size()')({}),
                        0
                    );
                });
            });

            describe('keys()', () => {
                it('basic', () => {
                    assert.deepEqual(
                        query('.(keys())')(data).sort(),
                        [...new Set(
                            data
                                .reduce((res, item) => res.concat(Object.keys(item)), [])
                        )].sort()
                    );
                });

                it('should not fails on non-object values', () => {
                    assert.deepEqual(
                        query('keys()')(null).sort(),
                        []
                    );
                });
            });

            describe('values()', () => {
                it('basic', () => {
                    assert.deepEqual(
                        query('[filename="1.css"].(values())')(data),
                        [...new Set(
                            Object.values(data[0])
                                .reduce((res, item) => res.concat(item), [])
                        )]
                    );
                });

                it('should return a slice of array', () => {
                    const actual = query('values()')(data);

                    assert.deepEqual(
                        actual,
                        data
                    );
                    assert.notStrictEqual(
                        actual,
                        data
                    );
                });

                it('should not fails on non-object values', () => {
                    assert.deepEqual(
                        query('values()')(null),
                        []
                    );
                });
            });

            describe('entries()', () => {
                it('basic', () => {
                    assert.deepEqual(
                        query('#.entries()')(data, data[0]),
                        Object
                            .keys(data[0])
                            .map(key => ({ key, value: data[0][key] }))
                    );
                });

                it('should return a index-value pairs for array', () => {
                    const actual = query('entries()')(data);

                    assert.deepEqual(
                        actual,
                        data.map((value, key) => ({ key, value }))
                    );
                });

                it('should not fails on non-object values', () => {
                    assert.deepEqual(
                        query('entries()')(null),
                        []
                    );
                });
            });

            describe('mapToArray()', () => {
                it('basic', () => {
                    assert.deepEqual(
                        query('mapToArray("foo")')({
                            a: { value: 1 },
                            b: { value: 2 }
                        }),
                        [
                            { foo: 'a', value: 1 },
                            { foo: 'b', value: 2 }
                        ]
                    );
                });

                it('should use key property to store key value when name is not passed', () => {
                    assert.deepEqual(
                        query('mapToArray()')({
                            a: { value: 1 },
                            b: { value: 2 }
                        }),
                        [
                            { key: 'a', value: 1 },
                            { key: 'b', value: 2 }
                        ]
                    );
                });

                it('should not fail on non-object values', () => {
                    assert.deepEqual(
                        query('mapToArray()')(),
                        []
                    );
                });
            });

            describe('sort()', () => {
                it('basic', () => {
                    assert.deepEqual(
                        query('deps.filename.sort()')(data),
                        [...new Set(
                            data
                                .reduce((res, item) => res.concat(item.deps), [])
                                .map(item => item.filename)
                        )].sort()
                    );
                });

                it('should be applicable for non-array values (have no effect)', () => {
                    assert.deepEqual(
                        query('.sort()')(data[0]),
                        data[0]
                    );
                });

                it('custom sorter', () => {
                    assert.deepEqual(
                        query('.sort(<refs.size()>).filename')(data),
                        data
                            .slice()
                            .sort((a, b) => a.refs.length - b.refs.length)
                            .map(item => item.filename)
                    );
                });

                it('should sort by several values', () => {
                    assert.deepEqual(
                        query('.sort(<(dependants.size(), deps.size())>).({filename, deps: deps.size(), dependants: dependants.size()})')(data),
                        data
                            .slice()
                            .sort((a, b) => ((a.dependants.length - b.dependants.length) || (a.deps.length - b.deps.length)))
                            .map(item => ({
                                filename: item.filename,
                                deps: item.deps.length,
                                dependants: item.dependants.length
                            }))
                    );
                });

                it('should not mutate original data', () => {
                    const data = [3, 2, 1];
                    const actual = query('.sort()')(data);

                    assert.deepEqual(
                        data,
                        [3, 2, 1]
                    );
                    assert.notStrictEqual(
                        actual,
                        data
                    );
                    assert.deepEqual(
                        actual,
                        [1, 2, 3]
                    );
                });
            });

            describe('reverse()', () => {
                it('basic', () => {
                    assert.deepEqual(
                        query('filename.reverse()')(data),
                        data
                            .map(item => item.filename)
                            .reverse()
                    );
                });

                it('should be applicable for non-array values (have no effect)', () => {
                    assert.deepEqual(
                        query('.reverse()')(data[0]),
                        data[0]
                    );
                });

                it('should not mutate original data', () => {
                    const data = [1, 2, 3];
                    const actual = query('.reverse()')(data);

                    assert.deepEqual(
                        data,
                        [1, 2, 3]
                    );
                    assert.notStrictEqual(
                        actual,
                        data
                    );
                    assert.deepEqual(
                        actual,
                        [3, 2, 1]
                    );
                });
            });

            describe('group()', () => {
                it('should be applicable for non-array values', () => {
                    assert.deepEqual(
                        query('.group(<type>)')(data),
                        ['css', 'js', 'svg']
                            .map(type => ({
                                key: type,
                                value: data.filter(item => item.type === type)
                            }))
                    );
                });

                it('should take second argument as map function for values', () => {
                    assert.deepEqual(
                        query('.group(<type>, <filename>)')(data),
                        ['css', 'js', 'svg']
                            .map(type => ({
                                key: type,
                                value: data
                                    .filter(item => item.type === type)
                                    .map(item => item.filename)
                            }))
                    );
                });

                it('should be applicable for non-array values', () => {
                    assert.deepEqual(
                        query('.group(<type>)')(data[0]),
                        [{ key: 'css', value: [data[0]] }]
                    );
                });

                it('should produce undefined key for each item when key fetcher is not set or not a function', () => {
                    assert.deepEqual(
                        query('.group()')(data),
                        [{ key: undefined, value: data }]
                    );
                });
            });

            describe('filter()', () => {
                it('should be the same as []', () => {
                    assert.deepEqual(
                        query('[type="js"]')(data),
                        query('.filter(<(type="js")>)')(data)
                    );
                });
            });

            describe('map()', () => {
                it('should be the same as .()', () => {
                    assert.deepEqual(
                        query('.(filename)')(data),
                        query('.map(<filename>)')(data)
                    );
                });
            });
        });
    });

    describe('operators', () => {
        describe('=', () => {
            it('basic test', () => {
                assert.deepEqual(
                    query('[filename="2.js"]')(data),
                    data
                        .filter(item => item.filename === '2.js')
                );
            });

            it('should compare scalars as JavaScript\'s === operator', () => {
                assert.deepEqual(
                    query('[uniqueNumber=456]')(data),
                    data
                        .filter(item => item.uniqueNumber === 456)
                );

                assert.deepEqual(
                    query('[uniqueNumber="456"]')(data),
                    data
                        .filter(item => item.uniqueNumber === '456')
                );
            });
        });

        describe('!=', () => {
            it('basic test', () => {
                assert.deepEqual(
                    query('[filename!="2.js"]')(data),
                    data
                        .filter(item => item.filename !== '2.js')
                );
            });

            it('should compare scalars as JavaScript\'s !== operator', () => {
                assert.deepEqual(
                    query('[uniqueNumber!=456]')(data),
                    data
                        .filter(item => item.uniqueNumber !== 456)
                );

                assert.deepEqual(
                    query('[uniqueNumber!="456"]')(data),
                    data
                        .filter(item => item.uniqueNumber !== '456')
                );
            });
        });

        describe('<', () => {
            it('basic test', () => {
                assert.deepEqual(
                    query('[filename<"4.js"]')(data),
                    data
                        .filter(item => item.filename < '4.js')
                );
            });

            it('should compare scalars as JavaScript\'s < operator', () => {
                assert.deepEqual(
                    query('[uniqueNumber<500]')(data),
                    data
                        .filter(item => item.uniqueNumber < 500)
                );
            });
        });

        describe('<=', () => {
            it('basic test', () => {
                assert.deepEqual(
                    query('[filename<="4.js"]')(data),
                    data
                        .filter(item => item.filename <= '4.js')
                );
            });

            it('should compare scalars as JavaScript\'s <= operator', () => {
                assert.deepEqual(
                    query('[uniqueNumber<=456]')(data),
                    data
                        .filter(item => item.uniqueNumber <= 456)
                );
            });
        });

        describe('>', () => {
            it('basic test', () => {
                assert.deepEqual(
                    query('[filename>"4.js"]')(data),
                    data
                        .filter(item => item.filename > '4.js')
                );
            });

            it('should compare scalars as JavaScript\'s > operator', () => {
                assert.deepEqual(
                    query('[uniqueNumber>400]')(data),
                    data
                        .filter(item => item.uniqueNumber > 400)
                );
            });
        });

        describe('>=', () => {
            it('basic test', () => {
                assert.deepEqual(
                    query('[filename>="4.js"]')(data),
                    data
                        .filter(item => item.filename >= '4.js')
                );
            });

            it('should compare scalars as JavaScript\'s >= operator', () => {
                assert.deepEqual(
                    query('[uniqueNumber>=456]')(data),
                    data
                        .filter(item => item.uniqueNumber >= 456)
                );
            });
        });

        describe('~=', () => {
            it('basic test', () => {
                assert.deepEqual(
                    query('[filename~=/\\.js$/]')(data),
                    data
                        .filter(item => /\.js$/.test(item.filename))
                );
            });

            it('should support for `i` flag', () => {
                assert.deepEqual(
                    query('[filename~=/\\.JS$/i]')(data),
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
        });

        describe('not', () => {
            it('basic', () => {
                assert.deepEqual(
                    query('[not errors]')(data),
                    data
                        .filter(item => !item.errors || !item.errors.length)
                );

                assert.deepEqual(
                    query('[not type="css"]')(data),
                    query('[type!="css"]')(data)
                );
            });

            it('should support alias `no`', () => {
                assert.deepEqual(
                    query('[no errors]')(data),
                    data
                        .filter(item => !item.errors || !item.errors.length)
                );
            });
        });

        describe('in', () => {
            it('basic', () => {
                assert.deepEqual(
                    query('[type in #]')(data, ['css', 'svg']),
                    data
                        .filter(item => item.type === 'css' || item.type === 'svg')
                );
            });

            it('not a in b', () => {
                assert.deepEqual(
                    query('[not type in #]')(data, ['css', 'svg']),
                    data
                        .filter(item => item.type !== 'css' && item.type !== 'svg')
                );
            });

            it('a not in b', () => {
                assert.deepEqual(
                    query('[type not in #]')(data, ['css', 'svg']),
                    data
                        .filter(item => item.type !== 'css' && item.type !== 'svg')
                );
            });
        });

        describe('or', () => {
            it('basic', () => {
                assert.deepEqual(
                    query('[type="css" or type="svg"]')(data),
                    data
                        .filter(item => item.type === 'css' || item.type === 'svg')
                );
            });

            it('should process arrays as a bool', () => {
                assert.deepEqual(
                    query('[errors or unique]')(data),
                    data
                        .filter(item => (item.errors && item.errors.length) || item.unique)
                );
            });

            it('should has lower precedence than `not`', () => {
                assert.deepEqual(
                    query('[not errors or unique]')(data),
                    data
                        .filter(item => !(item.errors && item.errors.length) || item.unique)
                );
            });
        });

        describe('and', () => {
            it('basic', () => {
                assert.deepEqual(
                    query('[type="css" and type="svg"]')(data),
                    data
                        .filter(item => item.type === 'css' && item.type === 'svg')
                );
            });

            it('should process arrays as a bool', () => {
                assert.deepEqual(
                    query('[errors and type="js"]')(data),
                    data
                        .filter(item => (item.errors && item.errors.length) && item.type === 'js')
                );
            });

            it('should has lower precedence than `not`', () => {
                assert.deepEqual(
                    query('[not errors and type="js"]')(data),
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
                    query('[uniqueNumber=455+1]')(data),
                    expected
                );
            });

            it('should concat arrays', () => {
                assert.deepEqual(
                    query('[type="js"]+[type="css"]')(data),
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
                    query('[type="js"]+[type="js" and errors]')(data),
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
                    query('[type="js"]+#')(data, data[0]),
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
                    query('[uniqueNumber=457-1]')(data),
                    expected
                );
            });

            it('should filter an array', () => {
                assert.deepEqual(
                    query('[type="js"]-[errors]')(data),
                    query('[type="js" and no errors]')(data)
                );
            });

            it('should filter an object', () => {
                assert.deepEqual(
                    query('[type="css"]-#')(data, data[0]),
                    data
                        .filter(item => item.type === 'css' && item !== data[0])
                );
            });

            it('should filter a scalar', () => {
                assert.deepEqual(
                    query('type-"js"')(data),
                    query('type[$!="js"]')(data)
                );
            });
        });

        describe('parentheses', () => {
            it('basic', () => {
                assert.deepEqual(
                    query('[not (errors and type="js")]')(data),
                    data
                        .filter(item => !((item.errors && item.errors.length) && item.type === 'js'))
                );
            });

            it('should not change the meaning', () => {
                assert.deepEqual(
                    query('[not (errors) and (type="js")]')(data),
                    data
                        .filter(item => !(item.errors && item.errors.length) && item.type === 'js')
                );
            });

            it('should allow optional whitespaces inside', () => {
                assert.deepEqual(
                    query('[not ( errors ) and ( type="js" )]')(data),
                    data
                        .filter(item => !(item.errors && item.errors.length) && item.type === 'js')
                );
            });

            it('should produce an array', () => {
                assert.deepEqual(
                    query('()')(data),
                    []
                );

                assert.deepEqual(
                    query('(1)')(data),
                    [1]
                );

                assert.deepEqual(
                    query('(1, 2)')(data),
                    [1, 2]
                );
            });

            it('should produce an empty array when single term is falsy', () => {
                assert.deepEqual(
                    query('(0)')(data),
                    []
                );

                assert.deepEqual(
                    query('({})')(data),
                    []
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
                        query(`[filename ${op} ${value}]`)(data),
                        query(`[filename${op}${value}]`)(data)
                    );
                })
            );
        });
    });

    describe('recursive invocation', () => {
        it('should call itself', () => {
            assert.deepEqual(
                query(`
                    .({
                        filename,
                        deps: deps.map(::self)
                    })
                `)(data[3]),
                (function rec(entry) {
                    return {
                        filename: entry.filename,
                        deps: entry.deps.map(rec)
                    };
                }(data[3]))
            );
        });

        it('should be callable', () => {
            assert.deepEqual(
                query(`
                    .({
                        filename,
                        deps: deps.map(<::self()>)
                    })
                `)(data[3]),
                (function rec(entry) {
                    return {
                        filename: entry.filename,
                        deps: entry.deps.map(rec)
                    };
                }(data[3]))
            );
        });

        it('should take first argument as a new data root', () => {
            const expected = {
                filename: data[3].filename,
                deps: [{
                    filename: 'stub',
                    deps: []
                }]
            };

            assert.deepEqual(
                query(`
                    .({
                        filename,
                        deps: deps.map(<::self({ filename: "stub", deps: () })>)
                    })
                `)(data[3]),
                expected
            );

            // alternative syntax
            assert.deepEqual(
                query(`
                    .({
                        filename,
                        deps: deps.(::self({ filename: "stub", deps: () }))
                    })
                `)(data[3]),
                expected
            );
        });

        it('should preserve subject across calls', () => {
            assert.deepEqual(
                query(`
                    .({
                        subject: #,
                        deps: deps.map(<::self()>)
                    })
                `)(data[3], data[1]),
                (function rec(entry) {
                    return {
                        subject: data[1],
                        deps: entry.deps.map(rec)
                    };
                }(data[3]))
            );
        });
    });

    describe('misc', () => {
        it('can be used with template literals', () => {
            assert.deepEqual(
                query`filename`(data),
                data
                    .map(item => item.filename)
            );
        });

        it('comments', () => {
            assert.deepEqual(
                query('// empty query')(data),
                data
            );
            assert.deepEqual(
                query(`
                    errors
                    // comments
                    .owner
                    // can be
                    [type="css"]// at any place
                    // until the line ending
                    .type
                `)(data),
                ['css']
            );
        });
    });
});
