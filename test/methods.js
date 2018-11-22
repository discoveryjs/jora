const assert = require('assert');
const data = require('./fixture/simple');
const query = require('../src');

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

            it('should return own keys count for plain objects', () => {
                assert.equal(
                    query('size()')({}),
                    0
                );
                assert.equal(
                    query('size()')({ foo: 1, bar: 2 }),
                    2
                );
                assert.equal(
                    query('size()')({ foo: 1, bar: 2, __proto__: { baz: 3 } }),
                    2
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
