import assert from 'assert';
import query from 'jora';

const data = {
    foo: [
        { a: 1, b: 2},
        { b: 3, c: 4},
        {},
        { d: 'a' }
    ],
    bar: 32
};

function linearSuggestions(suggestionsByType) {
    if (!suggestionsByType) {
        return suggestionsByType;
    }

    const suggestions = [];

    for (const entry of suggestionsByType) {
        for (const value of entry.suggestions) {
            suggestions.push({
                type: entry.type,
                from: entry.from,
                to: entry.to,
                text: entry.text,
                value: entry.type === 'value'
                    ? (typeof value === 'string' ? JSON.stringify(value) : String(value))
                    : value
            });
        }
    }

    return suggestions;
}

function suggestQuery(str, data, context) {
    let offset = 0;
    const suggestPoints = [];
    const clearedStr = str
        .split(/(\||<pipeline-op>)/)
        .map((part, idx) => {
            if (idx % 2 === 0) {
                offset += part.length;
                return part;
            }

            if (part !== '|') {
                offset++;
                return '|';
            }

            suggestPoints.push(offset);
            return '';
        })
        .join('');
    const stat = query(clearedStr, { tolerant: true, stat: true })(data, context);

    return suggestPoints.map(idx => linearSuggestions(stat.suggestion(idx)));
}

function suggestion(text, list, from, to = from) {
    return list.map(item => {
        const [value, type = 'property'] = item.split(':');

        return {
            type,
            value,
            from,
            to,
            text
        };
    });
}

function describeCases(title, cases) {
    describe(title, () => {
        Object.entries(cases).forEach(([queryString, expected]) => {
            (queryString[0] === '!' ? it.skip : it)(queryString, () => {
                assert.deepEqual(
                    suggestQuery(queryString, data),
                    expected
                );
            });
        });
    });
}

describe('query/suggestions', () => {
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
        objectSpread: ['.({...', '})'],
        array: ['.([', '])'],
        arraySpread: ['.([...', '])']
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

                    const wsQuery = `${prefix}${sbegin} | |${send}`;
                    it('ws: ' + wsQuery, () => {
                        assert.deepEqual(
                            suggestQuery(wsQuery, data),
                            [
                                ...Array(begin.length - 1).fill(null),
                                suggestion('', list, prefix.length + begin.length + 0),
                                suggestion('', list, prefix.length + begin.length + 1),
                                suggestion('', list, prefix.length + begin.length + 2),
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

    it('function context old syntax <...>', () => {
        assert.deepEqual(
            suggestQuery('map(|<|>|)', data),
            [
                null,
                suggestion('', ['foo', 'bar'], 5, 5),
                null
            ]
        );
    });

    it('function context', () => {
        assert.deepEqual(
            suggestQuery('map(|=|>|)', data),
            [
                null,
                null,
                suggestion('', ['foo', 'bar'], 6, 6)
            ]
        );
    });

    describeCases('string templates', {
        '`${| |}`': [
            suggestion('', ['foo', 'bar'], 3, 3),
            suggestion('', ['foo', 'bar'], 4, 4)
        ],
        '`${| |}${| |}`': [
            suggestion('', ['foo', 'bar'], 3, 3),
            suggestion('', ['foo', 'bar'], 4, 4),
            suggestion('', ['foo', 'bar'], 7, 7),
            suggestion('', ['foo', 'bar'], 8, 8)
        ],
        '`${}${| |}`': [
            suggestion('', ['foo', 'bar'], 6, 6),
            suggestion('', ['foo', 'bar'], 7, 7)
        ]
    });

    it('stress test', () => {
        const values = Array.from({ length: 1.2e5 }).map((_, idx) => String(idx));
        const actual = suggestQuery('.[$=|]', values)[0];
        const expected = suggestion('', values.slice(0, 20).map(v => JSON.stringify(v) + ':value'), 4, 4);

        assert.equal(actual.length, values.length);

        // compare first N items only for performance reasons (deepEqual is too slow for such big arrays)
        assert.deepEqual(
            actual.slice(0, expected.length),
            expected
        );
    });

    describe('method context', () => {
        ['', '.', '..', '$.', '$..'].forEach(prefix => {
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

    describeCases('variables', {
        '|$|f|;|': [
            suggestion('$f', ['foo', 'bar'], 0, 2),
            suggestion('$f', ['foo', 'bar'], 0, 2),
            suggestion('$f', ['foo', 'bar'], 0, 2),
            suggestion('', ['$f:variable', 'foo', 'bar'], 3)
        ],
        '|$|f|o|o|;| |': [
            suggestion('$foo', ['foo', 'bar'], 0, 4),
            suggestion('$foo', ['foo', 'bar'], 0, 4),
            suggestion('$foo', ['foo', 'bar'], 0, 4),
            suggestion('$foo', ['foo', 'bar'], 0, 4),
            suggestion('$foo', ['foo', 'bar'], 0, 4),
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
    });

    describeCases('mixed', {
        '.entries|(|).sort|(|)': [
            null,
            suggestion('', ['foo', 'bar'], 9, 9),
            null,
            suggestion('', ['foo', 'bar'], 16, 16)
        ],
        '.entries|(|a|,| |b|).sort|(|a|,| |b|)': [
            null,
            suggestion('a', ['foo', 'bar'], 9, 10),
            suggestion('a', ['foo', 'bar'], 9, 10),
            null,
            suggestion('b', ['foo', 'bar'], 12, 13),
            suggestion('b', ['foo', 'bar'], 12, 13),
            null,
            suggestion('a', ['foo', 'bar'], 20, 21),
            suggestion('a', ['foo', 'bar'], 20, 21),
            null,
            suggestion('b', ['foo', 'bar'], 23, 24),
            suggestion('b', ['foo', 'bar'], 23, 24)
        ],
        '{foo:[{},{bar:5}]}.foo.(|b|)': [
            suggestion('b', ['bar'], 24, 25),
            suggestion('b', ['bar'], 24, 25)
        ],
        '$[| | |]': [
            suggestion('', ['"foo":value', '"bar":value', 'foo', 'bar'], 2),
            suggestion('', ['"foo":value', '"bar":value', 'foo', 'bar'], 3),
            suggestion('', ['"foo":value', '"bar":value', 'foo', 'bar'], 4)
        ],
        '$[| |a| |]': [
            null,
            suggestion('a', ['"foo":value', '"bar":value', 'foo', 'bar'], 3, 4),
            suggestion('a', ['"foo":value', '"bar":value', 'foo', 'bar'], 3, 4),
            null
        ]
    });
});

describe('query/suggestions (tolerant mode)', () => {
    describeCases('trailing full stop', {
        '.|': [
            suggestion('', ['foo', 'bar'], 1, 1)
        ],
        '.foo.|': [
            suggestion('', ['a', 'b', 'c', 'd'], 5, 5)
        ]
    });

    describe('trailing full stop before operators', () => {
        [
            '=', '!=', '~=', '>=', '<=', '<', '>',
            '*', '/', '+', '-', '%', /* | */ '<pipeline-op>',
            'and', 'or', 'in', 'not in', 'has', 'has no'
        ].forEach(operator => {
            const queryString = '.| ' + operator + (operator === '~=' ? ' /a/' : ' 5');
            (it)(operator, () => {
                assert.deepEqual(
                    suggestQuery(queryString, data),
                    operator === 'in'
                        ? [[
                            ...suggestion('.', ['5:value'], 0, 1),
                            ...suggestion('', ['foo', 'bar'], 1)
                        ]]
                        : [
                            suggestion('', ['foo', 'bar'], 1)
                        ]
                );
            });
        });
    });

    describeCases('trailing double full stop', {
        '.|.|': [
            null,
            suggestion('', ['foo', 'bar'], 2, 2)
        ],
        '.foo.|.|': [
            null,
            suggestion('', ['a', 'b', 'c', 'd'], 6, 6)
        ]
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

    describeCases('trailing full stop with trailing whitespaces', {
        '.| |': [
            suggestion('', ['foo', 'bar'], 1),
            suggestion('', ['foo', 'bar'], 2)
        ],
        '.|\n  ': [
            suggestion('', ['foo', 'bar'], 1)
        ]
    });

    describeCases('trailing full stop with trailing comment', {
        '.|/|/|': [
            suggestion('', ['foo', 'bar'], 1),
            null,
            null
        ],
        '.|/|/|\n|': [
            suggestion('', ['foo', 'bar'], 1),
            null,
            null,
            suggestion('', ['foo', 'bar'], 4)
        ],
        '.|  //|': [
            suggestion('', ['foo', 'bar'], 1),
            null
        ],
        '.|  //1\n|  |//2\n//3\n|  |': [
            suggestion('', ['foo', 'bar'], 1),
            suggestion('', ['foo', 'bar'], 7),
            suggestion('', ['foo', 'bar'], 9),
            suggestion('', ['foo', 'bar'], 17),
            suggestion('', ['foo', 'bar'], 19)
        ],
        '.|  |/*1*/|\n  |/*2\n3*/\n|  |': [
            suggestion('', ['foo', 'bar'], 1),
            suggestion('', ['foo', 'bar'], 3),
            suggestion('', ['foo', 'bar'], 8),
            suggestion('', ['foo', 'bar'], 11),
            suggestion('', ['foo', 'bar'], 19),
            suggestion('', ['foo', 'bar'], 21)
        ],
        '.foo.|//|': [
            suggestion('', ['a', 'b', 'c', 'd'], 5),
            null
        ],
        '.foo.|/*|*/|': [
            suggestion('', ['a', 'b', 'c', 'd'], 5),
            null,
            null
        ]
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
            '=', '!=', '>=', '<=', '~=', /* '<', */ '>', // `<` is special case, see bellow
            '+', '-', '*', '/', '%'
        ].forEach(operator => {
            it('| |' + operator + '| |', () => {
                assert.deepEqual(
                    suggestQuery('| |' + operator + '| |', data),
                    [
                        suggestion('', ['foo', 'bar'], 0),
                        suggestion('', ['foo', 'bar'], 1),
                        suggestion('', ['foo', 'bar'], operator.length + 1),
                        suggestion('', ['foo', 'bar'], operator.length + 2)
                    ]
                );
            });
        });

        // a separate test for `<` since it may to be the beginning of function
        it('foo <| |', () => {
            assert.deepEqual(
                suggestQuery('foo <| |', data),
                [
                    suggestion('', ['foo', 'bar'], 5),
                    suggestion('', ['foo', 'bar'], 6)
                ]
            );
        });
    });

    describe('pipeline operator', () => {
        it('| |<pipeline-op>', () => {
            assert.deepEqual(
                suggestQuery('| |<pipeline-op>', data),
                [
                    suggestion('', ['foo', 'bar'], 0),
                    suggestion('', ['foo', 'bar'], 1)
                ]
            );
        });
        it('$ <pipeline-op>| |', () => {
            assert.deepEqual(
                suggestQuery('$ <pipeline-op>| |', data),
                [
                    suggestion('', ['foo', 'bar'], 3),
                    suggestion('', ['foo', 'bar'], 4)
                ]
            );
        });
    });

    describe('keyword operators', () => {
        const prefixOps = new Set(['no', 'not']);
        const postfixOps = new Set(['asc', 'desc']);
        const keywords = [
            'and', 'or',  // add 1 before `and` to force right expression evaluation
            'in', 'not in',
            'has', 'has no',
            ...prefixOps,
            ...postfixOps
        ];
        const ensureRightExprEvaluate = keywords.map(keyword =>
            // add 1 before `and` to force right expression evaluation
            keyword === 'and' ? '1 and' : keyword
        );

        describe('nothing around', () =>
            keywords.forEach(operator => {
                const queryString = '|' + operator + '|';

                it(queryString, () => {
                    assert.deepEqual(
                        suggestQuery(queryString, data),
                        [
                            null,
                            null
                        ]
                    );
                });
            })
        );

        describe('space before keyword', () =>
            keywords.forEach(operator => {
                const queryString = '| |' + operator;

                (operator === 'asc' || operator === 'desc' ? it.skip : it)(queryString, () => {
                    assert.deepEqual(
                        suggestQuery(queryString, data),
                        prefixOps.has(operator)
                            ? [
                                null,
                                null
                            ]
                            : [
                                suggestion('', ['foo', 'bar'], 0),
                                null
                            ]
                    );
                });
            })
        );

        describe('newline before keyword', () =>
            keywords.forEach(operator => {
                const queryString = '|\n|' + operator;

                (operator === 'asc' || operator === 'desc' ? it.skip : it)(queryString, () => {
                    assert.deepEqual(
                        suggestQuery(queryString, data),
                        prefixOps.has(operator)
                            ? [
                                null,
                                null
                            ]
                            : [
                                suggestion('', ['foo', 'bar'], 0),
                                null
                            ]
                    );
                });
            })
        );

        describe('array before keyword', () =>
            keywords.forEach(operator => {
                const queryString = '|[|]|' + operator;

                if (/^not?/.test(operator) || operator === 'asc' || operator === 'desc') {
                    return;
                }

                it(queryString, () => {
                    assert.deepEqual(
                        suggestQuery(queryString, data),
                        [
                            null,
                            suggestion('', ['foo', 'bar'], 1),
                            null
                        ]
                    );
                });
            })
        );

        describe('newline and comment before keyword', () =>
            keywords.forEach(operator => {
                const queryString = '|\n|//test|\n|\n|' + operator;

                (operator === 'asc' || operator === 'desc' ? it.skip : it)(JSON.stringify(queryString).slice(1, -1), () => {
                    assert.deepEqual(
                        suggestQuery(queryString, data),
                        prefixOps.has(operator)
                            ? [
                                null,
                                null,
                                null,
                                null,
                                null
                            ]
                            : [
                                suggestion('', ['foo', 'bar'], 0),
                                suggestion('', ['foo', 'bar'], 1),
                                null,
                                suggestion('', ['foo', 'bar'], 8),
                                null
                            ]
                    );
                });
            })
        );

        describe('a space after keyword', () =>
            ensureRightExprEvaluate.forEach(operator => {
                const queryString = operator + '| |';

                it(queryString, () => {
                    assert.deepEqual(
                        suggestQuery(queryString, data),
                        postfixOps.has(operator)
                            ? [
                                null,
                                null
                            ]
                            : [
                                null,
                                suggestion('', ['foo', 'bar'], operator.length + 1)
                            ]
                    );
                });
            })
        );

        describe('newline after keyword', () =>
            ensureRightExprEvaluate.forEach(operator => {
                const queryString = operator + '|\n|';

                it(queryString, () => {
                    assert.deepEqual(
                        suggestQuery(queryString, data),
                        postfixOps.has(operator)
                            ? [
                                null,
                                null
                            ]
                            : [
                                null,
                                suggestion('', ['foo', 'bar'], operator.length + 1)
                            ]
                    );
                });
            })
        );

        describe('array after keyword', () =>
            ensureRightExprEvaluate.forEach(queryString => {
                if (postfixOps.has(queryString)) {
                    return;
                }

                it(queryString + '|[|]', () => {
                    assert.deepEqual(
                        suggestQuery(queryString + '|[|]', data),
                        [
                            null,
                            suggestion('', ['foo', 'bar'], queryString.length + 1)
                        ]
                    );
                });
            })
        );
    });

    describe('value suggestion', () => {
        describe('in', () => {
            Object.entries({
                '|_| |i|n| ["a", "b", 3]': [
                    suggestion('_', ['"a":value', '"b":value', '3:value', 'foo', 'bar'], 0, 1),
                    suggestion('_', ['"a":value', '"b":value', '3:value', 'foo', 'bar'], 0, 1),
                    null,
                    null,
                    null
                ],
                '|_| |i|n| { "a": 1, "b": 2 }': [
                    suggestion('_', ['"a":value', '"b":value', 'foo', 'bar'], 0, 1),
                    suggestion('_', ['"a":value', '"b":value', 'foo', 'bar'], 0, 1),
                    null,
                    null,
                    null
                ],
                'keys().[$ in [|]]': [
                    suggestion('', ['"foo":value', '"bar":value'], 14)
                ],
                // FIXME: split in several test cases
                '["a", "b", "c", "d", 1, 2].[$a:"a"; $ in [| |"|b|"|,| |d|,| |1|,| |$|a|,| |]]': [
                    null,
                    suggestion('"b"', ['"c":value', '"d":value', '2:value'], 43, 46),
                    suggestion('"b"', ['"c":value', '"d":value', '2:value'], 43, 46),
                    suggestion('"b"', ['"c":value', '"d":value', '2:value'], 43, 46),
                    suggestion('"b"', ['"c":value', '"d":value', '2:value'], 43, 46),
                    null,
                    suggestion('d', ['"c":value', '"d":value', '2:value', '$a:variable'], 48, 49),
                    suggestion('d', ['"c":value', '"d":value', '2:value', '$a:variable'], 48, 49),
                    null,
                    suggestion('1', ['"c":value', '"d":value', '2:value'], 51, 52),
                    suggestion('1', ['"c":value', '"d":value', '2:value'], 51, 52),
                    null,
                    suggestion('$a', ['$a:variable'], 54, 56),
                    suggestion('$a', ['$a:variable'], 54, 56),
                    suggestion('$a', ['$a:variable'], 54, 56),
                    suggestion('', ['"c":value', '"d":value', '2:value', '$a:variable'], 57),
                    suggestion('', ['"c":value', '"d":value', '2:value', '$a:variable'], 58)
                ]
            }).forEach(([queryString, expected]) =>
                it(queryString, () =>
                    assert.deepEqual(
                        suggestQuery(queryString, data),
                        expected
                    )
                )
            );
        });

        describe('not in', () => {
            Object.entries({
                'keys().[$ not in [|]]': [
                    suggestion('', ['"foo":value', '"bar":value'], 18)
                ],
                // FIXME: split in several test cases
                '["a", "b", "c", "d", 1, 2].[$a:"a"; $ not in [| |"|b|"|,| |d|,| |1|,| |$|a|,| |]]': [
                    null,
                    suggestion('"b"', ['"c":value', '"d":value', '2:value'], 47, 50),
                    suggestion('"b"', ['"c":value', '"d":value', '2:value'], 47, 50),
                    suggestion('"b"', ['"c":value', '"d":value', '2:value'], 47, 50),
                    suggestion('"b"', ['"c":value', '"d":value', '2:value'], 47, 50),
                    null,
                    suggestion('d', ['"c":value', '"d":value', '2:value', '$a:variable'], 52, 53),
                    suggestion('d', ['"c":value', '"d":value', '2:value', '$a:variable'], 52, 53),
                    null,
                    suggestion('1', ['"c":value', '"d":value', '2:value'], 55, 56),
                    suggestion('1', ['"c":value', '"d":value', '2:value'], 55, 56),
                    null,
                    suggestion('$a', ['$a:variable'], 58, 60),
                    suggestion('$a', ['$a:variable'], 58, 60),
                    suggestion('$a', ['$a:variable'], 58, 60),
                    suggestion('', ['"c":value', '"d":value', '2:value', '$a:variable'], 61),
                    suggestion('', ['"c":value', '"d":value', '2:value', '$a:variable'], 62)
                ]
            }).forEach(([queryString, expected]) =>
                it(queryString, () =>
                    assert.deepEqual(
                        suggestQuery(queryString, data),
                        expected
                    )
                )
            );
        });

        describe('has', () => {
            Object.entries({
                '["a", "b", 3] |h|a|s| |_|': [
                    null,
                    null,
                    null,
                    null,
                    suggestion('_', ['"a":value', '"b":value', '3:value', 'foo', 'bar'], 18, 19),
                    suggestion('_', ['"a":value', '"b":value', '3:value', 'foo', 'bar'], 18, 19)
                ],
                '{ "a": 1, "b": 2 } |h|a|s| |_|': [
                    null,
                    null,
                    null,
                    null,
                    suggestion('_', ['"a":value', '"b":value', 'foo', 'bar'], 23, 24),
                    suggestion('_', ['"a":value', '"b":value', 'foo', 'bar'], 23, 24)
                ],
                'keys().[[|] has $]': [
                    suggestion('', ['"foo":value', '"bar":value'], 9)
                ],
                // FIXME: split in several test cases
                '["a", "b", "c", "d", 1, 2].[$a:"a";[| |"|b|"|,| |d|,| |1|,| |$|a|,| |] has $]': [
                    null,
                    suggestion('"b"', ['"c":value', '"d":value', '2:value'], 37, 40),
                    suggestion('"b"', ['"c":value', '"d":value', '2:value'], 37, 40),
                    suggestion('"b"', ['"c":value', '"d":value', '2:value'], 37, 40),
                    suggestion('"b"', ['"c":value', '"d":value', '2:value'], 37, 40),
                    null,
                    suggestion('d', ['"c":value', '"d":value', '2:value', '$a:variable'], 42, 43),
                    suggestion('d', ['"c":value', '"d":value', '2:value', '$a:variable'], 42, 43),
                    null,
                    suggestion('1', ['"c":value', '"d":value', '2:value'], 45, 46),
                    suggestion('1', ['"c":value', '"d":value', '2:value'], 45, 46),
                    null,
                    suggestion('$a', ['$a:variable'], 48, 50),
                    suggestion('$a', ['$a:variable'], 48, 50),
                    suggestion('$a', ['$a:variable'], 48, 50),
                    suggestion('', ['"c":value', '"d":value', '2:value', '$a:variable'], 51),
                    suggestion('', ['"c":value', '"d":value', '2:value', '$a:variable'], 52)
                ]
            }).forEach(([queryString, expected]) =>
                it(queryString, () =>
                    assert.deepEqual(
                        suggestQuery(queryString, data),
                        expected
                    )
                )
            );
        });

        describe('has no', () => {
            Object.entries({
                'keys().[[|] has no $]': [
                    suggestion('', ['"foo":value', '"bar":value'], 9)
                ],
                // FIXME: split in several test cases
                '["a", "b", "c", "d", 1, 2].[$a:"a";[| |"|b|"|,| |d|,| |1|,| |$|a|,| |] has no $]': [
                    null,
                    suggestion('"b"', ['"c":value', '"d":value', '2:value'], 37, 40),
                    suggestion('"b"', ['"c":value', '"d":value', '2:value'], 37, 40),
                    suggestion('"b"', ['"c":value', '"d":value', '2:value'], 37, 40),
                    suggestion('"b"', ['"c":value', '"d":value', '2:value'], 37, 40),
                    null,
                    suggestion('d', ['"c":value', '"d":value', '2:value', '$a:variable'], 42, 43),
                    suggestion('d', ['"c":value', '"d":value', '2:value', '$a:variable'], 42, 43),
                    null,
                    suggestion('1', ['"c":value', '"d":value', '2:value'], 45, 46),
                    suggestion('1', ['"c":value', '"d":value', '2:value'], 45, 46),
                    null,
                    suggestion('$a', ['$a:variable'], 48, 50),
                    suggestion('$a', ['$a:variable'], 48, 50),
                    suggestion('$a', ['$a:variable'], 48, 50),
                    suggestion('', ['"c":value', '"d":value', '2:value', '$a:variable'], 51),
                    suggestion('', ['"c":value', '"d":value', '2:value', '$a:variable'], 52)
                ]
            }).forEach(([queryString, expected]) =>
                it(queryString, () =>
                    assert.deepEqual(
                        suggestQuery(queryString, data),
                        expected
                    )
                )
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

    describeCases('variables', {
        '|$|;|': [
            suggestion('$', ['foo', 'bar'], 0, 1),
            suggestion('$', ['foo', 'bar'], 0, 1),
            suggestion('', ['foo', 'bar'], 2)
        ],
        '| |$| |;| |': [
            null,
            suggestion('$', ['foo', 'bar'], 1, 2),
            suggestion('$', ['foo', 'bar'], 1, 2),
            null,
            suggestion('', ['foo', 'bar'], 4),
            suggestion('', ['foo', 'bar'], 5)
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
        ],
        '$|x|:|$|;|$|x|.|': [
            null,
            null,
            null,
            null,
            suggestion('$x', ['$x:variable'], 5, 7),
            suggestion('$x', ['$x:variable'], 5, 7),
            suggestion('$x', ['$x:variable'], 5, 7),
            suggestion('', ['foo', 'bar'], 8, 8)
        ],
        '$|x|:[{ qux: 1 }]+|$|-|$|;|$|x|.|': [
            null,
            null,
            null,
            null,
            null,
            null,
            suggestion('$x', ['$x:variable'], 20, 22),
            suggestion('$x', ['$x:variable'], 20, 22),
            suggestion('$x', ['$x:variable'], 20, 22),
            suggestion('', ['qux'], 23, 23)
        ],
        '{x:|$|}.x.|': [
            null,
            null,
            suggestion('', ['foo', 'bar'], 8)
        ],
        '$_:{ a: 1, b: 2 };{$|}.|': [
            suggestion('$', ['$_:variable'], 19, 20),
            null
        ],
        '`${| |.| |}`': [
            suggestion('', ['foo', 'bar'], 3, 3),
            suggestion('', ['foo', 'bar'], 4, 4),
            suggestion('', ['foo', 'bar'], 5, 5),
            suggestion('', ['foo', 'bar'], 6, 6)
        ],
        '`${| |.| |}${}`': [
            suggestion('', ['foo', 'bar'], 3, 3),
            suggestion('', ['foo', 'bar'], 4, 4),
            suggestion('', ['foo', 'bar'], 5, 5),
            suggestion('', ['foo', 'bar'], 6, 6)
        ],
        '`${}${| |.| |}`': [
            suggestion('', ['foo', 'bar'], 6, 6),
            suggestion('', ['foo', 'bar'], 7, 7),
            suggestion('', ['foo', 'bar'], 8, 8),
            suggestion('', ['foo', 'bar'], 9, 9)
        ]
    });
});
