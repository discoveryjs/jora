const assert = require('assert');
const query = require('../src');
const data = {
    foo: [
        { a: 1, b: 2},
        { b: 3, c: 4},
        {},
        { d: 5 }
    ],
    bar: 32
};

function suggestQuery(str, data, context) {
    const suggestPoints = [];
    const clearedStr = str.replace(/\|/g, (m, idx) => {
        suggestPoints.push(idx - suggestPoints.length);
        return '';
    });
    const stat = query(clearedStr, { tolerant: true, stat: true })(data, context);

    return suggestPoints.map(idx => stat.suggestion(idx));
}

function suggestion(current, list, from, to = from) {
    return list.map(item => {
        const [value, type = 'property'] = item.split(':');

        return {
            current,
            type,
            value,
            from,
            to
        };
    });
}

describe('suggest', () => {
    it('empty query', () => {
        assert.deepEqual(
            suggestQuery('|', data),
            [
                suggestion('', ['foo', 'bar'], 0, 0)
            ]
        );
    });

    it('simple path', () => {
        const foo = suggestion('foo', ['foo', 'bar'], 0, 3);
        const bar = suggestion('bar', ['a', 'b', 'c', 'd'], 4, 7);

        assert.deepEqual(
            suggestQuery('|f|o|o|.|b|a|r|', data),
            [
                ...Array(4).fill(foo),
                ...Array(4).fill(bar)
            ]
        );
    });

    Object.entries({
        filter: ['.[', ']'],
        map: ['.(', ')'],
        recursiveMap: ['..(', ')'],
        object: ['.({', '})'],
        array: ['.([', '])']
    }).forEach(([name, [begin, end]]) => {
        const sbegin = begin.replace(/./g, '$&|');
        const send = end.replace(/./g, '$&|');

        describe(name, () => {
            Object.entries({
                '': ['foo', 'bar'],
                foo: ['a', 'b', 'c', 'd']
            }).forEach(([prefix, list]) => {
                describe('with prefix `' + prefix + '`', () => {
                    const emptyQuery = `${prefix}${sbegin}${send}`;
                    it('empty: ' + emptyQuery, () => {
                        assert.deepEqual(
                            suggestQuery(emptyQuery, data),
                            [
                                ...Array(begin.length - 1).fill(null),
                                suggestion('', list, prefix.length + begin.length),
                                ...Array(end.length).fill(null)
                            ]
                        );
                    });

                    const wsQuery = `${prefix}${sbegin} | | |${send}`;
                    it('ws: ' + wsQuery, () => {
                        assert.deepEqual(
                            suggestQuery(wsQuery, data),
                            [
                                ...Array(begin.length - 1).fill(null),
                                suggestion('', list, prefix.length + begin.length + 0),
                                suggestion('', list, prefix.length + begin.length + 1),
                                suggestion('', list, prefix.length + begin.length + 2),
                                suggestion('', list, prefix.length + begin.length + 3),
                                ...Array(end.length).fill(null)
                            ]
                        );
                    });

                    const tokenQuery = `${prefix}${sbegin} |b|a|z| |${send}`;
                    it('with a token: ' + tokenQuery, () => {
                        const from = prefix.length + begin.length + 1;
                        const to = prefix.length + begin.length + 4;

                        assert.deepEqual(
                            suggestQuery(tokenQuery, data),
                            [
                                ...Array(begin.length).fill(null),
                                suggestion('baz', list, from, to),
                                suggestion('baz', list, from, to),
                                suggestion('baz', list, from, to),
                                suggestion('baz', list, from, to),
                                ...Array(end.length + 1).fill(null)
                            ]
                        );
                    });
                });
            });
        });
    });

    it('object context', () => {
        assert.deepEqual(
            suggestQuery('{| |a|,| |b| |}', data),
            [
                null,
                suggestion('a', ['foo', 'bar'], 2, 3),
                suggestion('a', ['foo', 'bar'], 2, 3),
                null,
                suggestion('b', ['foo', 'bar'], 5, 6),
                suggestion('b', ['foo', 'bar'], 5, 6),
                null
            ]
        );
    });

    it('array context', () => {
        assert.deepEqual(
            suggestQuery('[| |a|,| |b| |]', data),
            [
                null,
                suggestion('a', ['foo', 'bar'], 2, 3),
                suggestion('a', ['foo', 'bar'], 2, 3),
                null,
                suggestion('b', ['foo', 'bar'], 5, 6),
                suggestion('b', ['foo', 'bar'], 5, 6),
                null
            ]
        );
    });

    describe('method context', () => {
        ['', '.', '$.'].forEach(prefix => {
            describe(`${prefix}method(...)`, () => {
                it('no arguments', () => {
                    assert.deepEqual(
                        suggestQuery(prefix + 'size(| | |)', data),
                        [
                            suggestion('', ['foo', 'bar'], prefix.length + 5),
                            suggestion('', ['foo', 'bar'], prefix.length + 6),
                            suggestion('', ['foo', 'bar'], prefix.length + 7)
                        ]
                    );
                });

                it('single argument', () => {
                    assert.deepEqual(
                        suggestQuery(prefix + 'size(| |a| |)', data),
                        [
                            null,
                            suggestion('a', ['foo', 'bar'], prefix.length + 6, prefix.length + 7),
                            suggestion('a', ['foo', 'bar'], prefix.length + 6, prefix.length + 7),
                            null
                        ]
                    );
                });

                it('multiple arguments', () => {
                    assert.deepEqual(
                        suggestQuery(prefix + 'size(| |a|,| |b|,| |c| |,| |d| |)', data),
                        [
                            null,
                            suggestion('a', ['foo', 'bar'], prefix.length + 6, prefix.length + 7),
                            suggestion('a', ['foo', 'bar'], prefix.length + 6, prefix.length + 7),
                            null,
                            suggestion('b', ['foo', 'bar'], prefix.length + 9, prefix.length + 10),
                            suggestion('b', ['foo', 'bar'], prefix.length + 9, prefix.length + 10),
                            null,
                            suggestion('c', ['foo', 'bar'], prefix.length + 12, prefix.length + 13),
                            suggestion('c', ['foo', 'bar'], prefix.length + 12, prefix.length + 13),
                            null,
                            null,
                            suggestion('d', ['foo', 'bar'], prefix.length + 16, prefix.length + 17),
                            suggestion('d', ['foo', 'bar'], prefix.length + 16, prefix.length + 17),
                            null
                        ]
                    );
                });
            });
        });
    });

    describe('variables', () => {
        Object.entries({
            '$|f|;|': [
                suggestion('f', ['foo', 'bar'], 1, 2),
                suggestion('f', ['foo', 'bar'], 1, 2),
                suggestion('', ['$f:variable', 'foo', 'bar'], 3)
            ],
            '$|f|o|o|;| |': [
                suggestion('foo', ['foo', 'bar'], 1, 4),
                suggestion('foo', ['foo', 'bar'], 1, 4),
                suggestion('foo', ['foo', 'bar'], 1, 4),
                suggestion('foo', ['foo', 'bar'], 1, 4),
                suggestion('', ['$foo:variable', 'foo', 'bar'], 5),
                suggestion('', ['$foo:variable', 'foo', 'bar'], 6)
            ],
            '$a;foo.(|$|)': [
                suggestion('$', ['$a:variable'], 8, 9),
                suggestion('$', ['$a:variable'], 8, 9)
            ],
            '$a;$aa;$aaa;{a:| |$|a| |}': [
                null,
                suggestion('$a', ['$a:variable', '$aa:variable', '$aaa:variable'], 16, 18),
                suggestion('$a', ['$a:variable', '$aa:variable', '$aaa:variable'], 16, 18),
                suggestion('$a', ['$a:variable', '$aa:variable', '$aaa:variable'], 16, 18),
                null
            ],
            '$foo;{| |$|f|,| |f| |}': [
                null,
                suggestion('$f', ['$foo:variable'], 7, 9),
                suggestion('$f', ['$foo:variable'], 7, 9),
                suggestion('$f', ['$foo:variable'], 7, 9),
                null,
                suggestion('f', ['$foo:variable', 'foo', 'bar'], 11, 12),
                suggestion('f', ['$foo:variable', 'foo', 'bar'], 11, 12),
                null
            ]
        }).forEach(([queryString, expected]) => {
            it(queryString, () => {
                assert.deepEqual(
                    suggestQuery(queryString, data),
                    expected
                );
            });
        });
    });
});

describe('suggest in tolerant parsing mode (autocorrection)', () => {
    it('trailing full stop', () => {
        assert.deepEqual(
            suggestQuery('.|', data),
            [
                suggestion('', ['foo', 'bar'], 1, 1)
            ]
        );

        assert.deepEqual(
            suggestQuery('.foo.|', data),
            [
                suggestion('', ['a', 'b', 'c', 'd'], 5, 5)
            ]
        );
    });

    describe('trailing full stop before operators', () => {
        ['=', '!=', '>', '<', '~=', '*', '/', '+', '-'].forEach(operator => {
            const queryString = '.| ' + operator + (operator === '~=' ? ' /a/' : ' 5');
            it(operator, () => {
                assert.deepEqual(
                    suggestQuery(queryString, data),
                    [
                        suggestion('', ['foo', 'bar'], 1)
                    ]
                );
            });
        });
    });

    it('trailing double full stop', () => {
        assert.deepEqual(
            suggestQuery('.|.|', data),
            [
                null,
                suggestion('', ['foo', 'bar'], 2, 2)
            ]
        );

        assert.deepEqual(
            suggestQuery('.foo.|.|', data),
            [
                null,
                suggestion('', ['a', 'b', 'c', 'd'], 6, 6)
            ]
        );
    });

    it('nested trailing full stop', () => {
        assert.deepEqual(
            suggestQuery('.foo.[.|].|', data),
            [
                suggestion('', ['a', 'b', 'c', 'd'], 7),
                null
            ]
        );
    });

    it('trailing full stop with trailing whitespaces', () => {
        assert.deepEqual(
            suggestQuery('.| |', data),
            [
                suggestion('', ['foo', 'bar'], 1),
                suggestion('', ['foo', 'bar'], 2)
            ]
        );

        assert.deepEqual(
            suggestQuery('.|\n  ', data),
            [
                suggestion('', ['foo', 'bar'], 1)
            ]
        );
    });

    it('trailing full stop with trailing comment', () => {
        assert.deepEqual(
            suggestQuery('.|//', data),
            [
                suggestion('', ['foo', 'bar'], 1)
            ]
        );

        assert.deepEqual(
            suggestQuery('.|  //', data),
            [
                suggestion('', ['foo', 'bar'], 1)
            ]
        );

        assert.deepEqual(
            suggestQuery('.|  //1\n  //2\n//3\n  ', data),
            [
                suggestion('', ['foo', 'bar'], 1)
            ]
        );

        assert.deepEqual(
            suggestQuery('.foo.|//', data),
            [
                suggestion('', ['a', 'b', 'c', 'd'], 5)
            ]
        );
    });

    it('trailing comma', () => {
        assert.deepEqual(
            suggestQuery('[foo,|]', data),
            [
                suggestion('', ['foo', 'bar'], 5)
            ]
        );
    });

    describe('operators', () => {
        [
            '+', '-', '*', '/', '%',
            '=', '!=', '~=', '>=', '<=', '<', '>'
        ].forEach(operator => {
            (['/', '~=', '<', '>'].includes(operator) ? it.skip : it)('foo ' + operator, () => {
                assert.deepEqual(
                    suggestQuery('foo ' + operator + '| |', data),
                    [
                        suggestion('', ['foo', 'bar'], operator.length + 4),
                        suggestion('', ['foo', 'bar'], operator.length + 5)
                    ]
                );
            });
        });

        [
            'true and', 'false or', 'foo in', 'foo not in', 'no', 'not'
        ].forEach(queryString => {
            it(queryString + '| |', () => {
                assert.deepEqual(
                    suggestQuery(queryString + '| |', data),
                    [
                        null,
                        suggestion('', ['foo', 'bar'], queryString.length + 1)
                    ]
                );
            });

            it(queryString + '|[|]', () => {
                assert.deepEqual(
                    suggestQuery(queryString + '|[|]', data),
                    [
                        null,
                        suggestion('', ['foo', 'bar'], queryString.length + 1)
                    ]
                );
            });
        });
    });

    describe('value suggestion', () => {
        it('in', () => {
            assert.deepEqual(
                suggestQuery('|a| |i|n| ["a", "b", 3]', data),
                [
                    suggestion('a', ['foo', 'bar', '"a":value', '"b":value', '3:value'], 0, 1),
                    suggestion('a', ['foo', 'bar', '"a":value', '"b":value', '3:value'], 0, 1),
                    null,
                    null,
                    null
                ]
            );
        });

        ['=', '!='].forEach(operator => {
            const queryString = 'foo.b ' + operator + '| |';
            it(queryString, () => {
                assert.deepEqual(
                    suggestQuery(queryString, data),
                    [
                        suggestion('', ['2:value', '3:value', 'foo', 'bar'], queryString.length - 3),
                        suggestion('', ['2:value', '3:value', 'foo', 'bar'], queryString.length - 2)
                    ]
                );
            });
        });
    });

    describe('influence on division (/) interference with regexp', () => {
        [
            // '.| / 2 / 2',
            'size(1, /a/, /b/, |)',
            'size(1/2, 1/4, |)'
        ].forEach(queryString => {
            it(queryString, () => {
                assert.deepEqual(
                    suggestQuery(queryString, { foo: 32, bar: { baz: 32 } }),
                    [
                        suggestion('', ['foo', 'bar'], queryString.indexOf('|'))
                    ]
                );
            });
        });
    });

    describe('variables', () => {
        Object.entries({
            '|$|;|': [
                null,
                suggestion('', ['foo', 'bar'], 1, 1),
                suggestion('', ['foo', 'bar'], 2)
            ],
            '$|v|a|r|:|;|': [
                null,
                null,
                null,
                null,
                suggestion('', ['foo', 'bar'], 5),
                suggestion('', ['$var:variable', 'foo', 'bar'], 6)
            ],
            '$foo;$var:|;|': [
                suggestion('', ['$foo:variable', 'foo', 'bar'], 10),
                suggestion('', ['$foo:variable', '$var:variable', 'foo', 'bar'], 11)
            ]
        }).forEach(([queryString, expected]) => {
            it(queryString, () => {
                assert.deepEqual(
                    suggestQuery(queryString, data),
                    expected
                );
            });
        });
    });
});
