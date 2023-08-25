import assert from 'assert';
import query from 'jora';
import localMethods from '../src/methods.js';

const localMethodNames = Object.keys(localMethods).map(n=>`${n}:method`);

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

function suggestQuery(str, data, options) {
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
    const stat = query(clearedStr, { tolerant: true, ...options, stat: true })(data, context);

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

function describeCasesWithOptions(title, options, cases) {
    describe(title, () => {
        Object.entries(cases).forEach(([queryString, expected]) => {
            (queryString[0] === '!' ? it.skip : it)(queryString, () => {
                assert.deepEqual(
                    suggestQuery(queryString, data, options),
                    expected
                );
            });
        });
    });
}

function describeCases(title, cases) {
    return describeCasesWithOptions(title, { tolerant: false }, cases);
}

function describeCasesTolerant(title, cases) {
    return describeCasesWithOptions(title, { tolerant: true }, cases);
}

describe('query/suggestions', () => {
    it('empty query', () => {
        assert.deepEqual(
            suggestQuery('|', data),
            [
                suggestion('', ['foo', 'bar', ...localMethodNames], 0, 0)
            ]
        );
    });

    it('simple path', () => {
        const foo = suggestion('foo', ['foo', 'bar', ...localMethodNames], 0, 3);
        const bar = suggestion('bar', ['a', 'b', 'c', 'd', ...localMethodNames], 4, 7);

        assert.deepEqual(
            suggestQuery('|f|o|o|.|b|a|r|', data),
            [
                ...Array(4).fill(foo),
                ...Array(4).fill(bar)
            ]
        );
    });

    it('custom helpers', () => {
        assert.deepEqual(
            suggestQuery('|', data, {methods: {h1: Boolean, h2: Boolean}}),
            [
                suggestion('', ['foo', 'bar', ...localMethodNames, 'h1:method', 'h2:method'], 0, 0)
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
                '': ['foo', 'bar', ...localMethodNames],
                foo: ['a', 'b', 'c', 'd', ...localMethodNames]
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
                suggestion('a', ['foo', 'bar', ...localMethodNames], 2, 3),
                suggestion('a', ['foo', 'bar', ...localMethodNames], 2, 3),
                null,
                suggestion('b', ['foo', 'bar', ...localMethodNames], 5, 6),
                suggestion('b', ['foo', 'bar', ...localMethodNames], 5, 6),
                null
            ]
        );
    });

    it('array context', () => {
        assert.deepEqual(
            suggestQuery('[| |a|,| |b| |]', data),
            [
                null,
                suggestion('a', ['foo', 'bar', ...localMethodNames], 2, 3),
                suggestion('a', ['foo', 'bar', ...localMethodNames], 2, 3),
                null,
                suggestion('b', ['foo', 'bar', ...localMethodNames], 5, 6),
                suggestion('b', ['foo', 'bar', ...localMethodNames], 5, 6),
                null
            ]
        );
    });

    it('function context old syntax <...>', () => {
        assert.deepEqual(
            suggestQuery('map(|<|>|)', data),
            [
                null,
                suggestion('', ['foo', 'bar', ...localMethodNames], 5, 5),
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
                suggestion('', ['foo', 'bar', ...localMethodNames], 6, 6)
            ]
        );
    });

    describeCases('pick', {
        '$[| |]': [
            suggestion('', ['"foo":value', '"bar":value', 'foo', 'bar', ...localMethodNames], 2, 2),
            suggestion('', ['"foo":value', '"bar":value', 'foo', 'bar', ...localMethodNames], 3, 3)
        ],
        '$[| |"|"| |]': [
            null,
            suggestion('""', ['"foo":value', '"bar":value'], 3, 5),
            suggestion('""', ['"foo":value', '"bar":value'], 3, 5),
            suggestion('""', ['"foo":value', '"bar":value'], 3, 5),
            null
        ],
        '$[| |"|x|"| |]': [
            null,
            suggestion('"x"', ['"foo":value', '"bar":value'], 3, 6),
            suggestion('"x"', ['"foo":value', '"bar":value'], 3, 6),
            suggestion('"x"', ['"foo":value', '"bar":value'], 3, 6),
            suggestion('"x"', ['"foo":value', '"bar":value'], 3, 6),
            null
        ],
        '$[| |\'|\'| |]': [
            null,
            suggestion('\'\'', ['"foo":value', '"bar":value'], 3, 5),
            suggestion('\'\'', ['"foo":value', '"bar":value'], 3, 5),
            suggestion('\'\'', ['"foo":value', '"bar":value'], 3, 5),
            null
        ],
        '$[| |\'|x|\'| |]': [
            null,
            suggestion('\'x\'', ['"foo":value', '"bar":value'], 3, 6),
            suggestion('\'x\'', ['"foo":value', '"bar":value'], 3, 6),
            suggestion('\'x\'', ['"foo":value', '"bar":value'], 3, 6),
            suggestion('\'x\'', ['"foo":value', '"bar":value'], 3, 6),
            null
        ],
        '$[| |1| |]': [
            null,
            null,
            null,
            null
        ],
        '$[| |a| |]': [
            null,
            suggestion('a', ['"foo":value', '"bar":value', 'foo', 'bar', ...localMethodNames], 3, 4),
            suggestion('a', ['"foo":value', '"bar":value', 'foo', 'bar', ...localMethodNames], 3, 4),
            null
        ],
        '$a;$[| |$|a| |]': [
            null,
            suggestion('$a', ['"foo":value', '"bar":value', '$a:variable'], 6, 8),
            suggestion('$a', ['"foo":value', '"bar":value', '$a:variable'], 6, 8),
            suggestion('$a', ['"foo":value', '"bar":value', '$a:variable'], 6, 8),
            null
        ],
        '$[=> $$ =| |"|"| |]': [
            null,
            suggestion('""', ['"foo":value', '"bar":value'], 10, 12),
            suggestion('""', ['"foo":value', '"bar":value'], 10, 12),
            suggestion('""', ['"foo":value', '"bar":value'], 10, 12),
            null
        ]
    });

    describeCases('string templates', {
        '`${| |}`': [
            suggestion('', ['foo', 'bar', ...localMethodNames], 3, 3),
            suggestion('', ['foo', 'bar', ...localMethodNames], 4, 4)
        ],
        '`${| |}${| |}`': [
            suggestion('', ['foo', 'bar', ...localMethodNames], 3, 3),
            suggestion('', ['foo', 'bar', ...localMethodNames], 4, 4),
            suggestion('', ['foo', 'bar', ...localMethodNames], 7, 7),
            suggestion('', ['foo', 'bar', ...localMethodNames], 8, 8)
        ],
        '`${}${| |}`': [
            suggestion('', ['foo', 'bar', ...localMethodNames], 6, 6),
            suggestion('', ['foo', 'bar', ...localMethodNames], 7, 7)
        ]
    });

    it('stress test', () => {
        const values = Array.from({ length: 1.2e5 }).map((_, idx) => String(idx));
        const actual = suggestQuery('.[$=|]', values)[0];
        const expected = suggestion('', values.slice(0, 20).map(v => JSON.stringify(v) + ':value'), 4, 4);

        assert.equal(actual.length, values.length + localMethodNames.length);

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
                            suggestion('', ['foo', 'bar', ...localMethodNames], prefix.length + 5),
                            suggestion('', ['foo', 'bar', ...localMethodNames], prefix.length + 6),
                            suggestion('', ['foo', 'bar', ...localMethodNames], prefix.length + 7)
                        ]
                    );
                });

                it('single argument', () => {
                    assert.deepEqual(
                        suggestQuery(prefix + 'size(| |a| |)', data),
                        [
                            null,
                            suggestion('a', ['foo', 'bar', ...localMethodNames], prefix.length + 6, prefix.length + 7),
                            suggestion('a', ['foo', 'bar', ...localMethodNames], prefix.length + 6, prefix.length + 7),
                            null
                        ]
                    );
                });

                it('multiple arguments', () => {
                    assert.deepEqual(
                        suggestQuery(prefix + 'size(| |a|,| |b|,| |c| |,| |d| |)', data),
                        [
                            null,
                            suggestion('a', ['foo', 'bar', ...localMethodNames], prefix.length + 6, prefix.length + 7),
                            suggestion('a', ['foo', 'bar', ...localMethodNames], prefix.length + 6, prefix.length + 7),
                            null,
                            suggestion('b', ['foo', 'bar', ...localMethodNames], prefix.length + 9, prefix.length + 10),
                            suggestion('b', ['foo', 'bar', ...localMethodNames], prefix.length + 9, prefix.length + 10),
                            null,
                            suggestion('c', ['foo', 'bar', ...localMethodNames], prefix.length + 12, prefix.length + 13),
                            suggestion('c', ['foo', 'bar', ...localMethodNames], prefix.length + 12, prefix.length + 13),
                            null,
                            null,
                            suggestion('d', ['foo', 'bar', ...localMethodNames], prefix.length + 16, prefix.length + 17),
                            suggestion('d', ['foo', 'bar', ...localMethodNames], prefix.length + 16, prefix.length + 17),
                            null
                        ]
                    );
                });
            });
        });
    });

    describeCases('variables', {
        '|$|f|;|': [
            suggestion('$f', ['foo', 'bar', ...localMethodNames], 0, 2),
            suggestion('$f', ['foo', 'bar', ...localMethodNames], 0, 2),
            suggestion('$f', ['foo', 'bar', ...localMethodNames], 0, 2),
            suggestion('', ['$f:variable', 'foo', 'bar', ...localMethodNames], 3, 3)
        ],
        '|$|f|o|o|;| |': [
            suggestion('$foo', ['foo', 'bar', ...localMethodNames], 0, 4),
            suggestion('$foo', ['foo', 'bar', ...localMethodNames], 0, 4),
            suggestion('$foo', ['foo', 'bar', ...localMethodNames], 0, 4),
            suggestion('$foo', ['foo', 'bar', ...localMethodNames], 0, 4),
            suggestion('$foo', ['foo', 'bar', ...localMethodNames], 0, 4),
            suggestion('', ['$foo:variable', 'foo', 'bar', ...localMethodNames], 5),
            suggestion('', ['$foo:variable', 'foo', 'bar', ...localMethodNames], 6)
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
        ]
    });

    describeCases('mixed', {
        '.entries|(|).sort|(|)': [
            null,
            suggestion('', ['foo', 'bar', ...localMethodNames], 9, 9),
            null,
            suggestion('', ['foo', 'bar', ...localMethodNames], 16, 16)
        ],
        '.entries|(|a|,| |b|).sort|(|a|,| |b|)': [
            null,
            suggestion('a', ['foo', 'bar', ...localMethodNames], 9, 10),
            suggestion('a', ['foo', 'bar', ...localMethodNames], 9, 10),
            null,
            suggestion('b', ['foo', 'bar', ...localMethodNames], 12, 13),
            suggestion('b', ['foo', 'bar', ...localMethodNames], 12, 13),
            null,
            suggestion('a', ['foo', 'bar', ...localMethodNames], 20, 21),
            suggestion('a', ['foo', 'bar', ...localMethodNames], 20, 21),
            null,
            suggestion('b', ['foo', 'bar', ...localMethodNames], 23, 24),
            suggestion('b', ['foo', 'bar', ...localMethodNames], 23, 24)
        ],
        '{foo:[{},{bar:5}]}.foo.(|b|)': [
            suggestion('b', ['bar', ...localMethodNames], 24, 25),
            suggestion('b', ['bar', ...localMethodNames], 24, 25)
        ],
        '$[| | |]': [
            suggestion('', ['"foo":value', '"bar":value', 'foo', 'bar', ...localMethodNames], 2),
            suggestion('', ['"foo":value', '"bar":value', 'foo', 'bar', ...localMethodNames], 3),
            suggestion('', ['"foo":value', '"bar":value', 'foo', 'bar', ...localMethodNames], 4)
        ],
        '$[| |a| |]': [
            null,
            suggestion('a', ['"foo":value', '"bar":value', 'foo', 'bar', ...localMethodNames], 3, 4),
            suggestion('a', ['"foo":value', '"bar":value', 'foo', 'bar', ...localMethodNames], 3, 4),
            null
        ]
    });
});

describe('query/suggestions (tolerant mode)', () => {
    describeCasesTolerant('trailing full stop', {
        '.|': [
            suggestion('', ['foo', 'bar', ...localMethodNames], 1, 1)
        ],
        '.foo.|': [
            suggestion('', ['a', 'b', 'c', 'd', ...localMethodNames], 5, 5)
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
                    suggestQuery(queryString, data), [
                        suggestion('', ['foo', 'bar', ...localMethodNames], 1)
                    ]
                );
            });
        });
    });

    describeCasesTolerant('trailing double full stop', {
        '.|.|': [
            null,
            suggestion('', ['foo', 'bar', ...localMethodNames], 2, 2)
        ],
        '.foo.|.|': [
            null,
            suggestion('', ['a', 'b', 'c', 'd', ...localMethodNames], 6, 6)
        ]
    });

    it('nested trailing full stop', () => {
        assert.deepEqual(
            suggestQuery('.foo.[.|].|', data),
            [
                suggestion('', ['a', 'b', 'c', 'd', ...localMethodNames], 7, 7),
                suggestion('', [...localMethodNames], 9, 9)
            ]
        );
    });

    describeCasesTolerant('trailing full stop with trailing whitespaces', {
        '.| |': [
            suggestion('', ['foo', 'bar', ...localMethodNames], 1),
            suggestion('', ['foo', 'bar', ...localMethodNames], 2)
        ],
        '.|\n  ': [
            suggestion('', ['foo', 'bar', ...localMethodNames], 1)
        ]
    });

    describeCasesTolerant('trailing full stop with trailing comment', {
        '.|/|/|': [
            suggestion('', ['foo', 'bar', ...localMethodNames], 1),
            null,
            null
        ],
        '.|/|/|\n|': [
            suggestion('', ['foo', 'bar', ...localMethodNames], 1),
            null,
            null,
            suggestion('', ['foo', 'bar', ...localMethodNames], 4)
        ],
        '.|  //|': [
            suggestion('', ['foo', 'bar', ...localMethodNames], 1),
            null
        ],
        '.|  //1\n|  |//2\n//3\n|  |': [
            suggestion('', ['foo', 'bar', ...localMethodNames], 1),
            suggestion('', ['foo', 'bar', ...localMethodNames], 7),
            suggestion('', ['foo', 'bar', ...localMethodNames], 9),
            suggestion('', ['foo', 'bar', ...localMethodNames], 17),
            suggestion('', ['foo', 'bar', ...localMethodNames], 19)
        ],
        '.|  |/*1*/|\n  |/*2\n3*/\n|  |': [
            suggestion('', ['foo', 'bar', ...localMethodNames], 1),
            suggestion('', ['foo', 'bar', ...localMethodNames], 3),
            suggestion('', ['foo', 'bar', ...localMethodNames], 8),
            suggestion('', ['foo', 'bar', ...localMethodNames], 11),
            suggestion('', ['foo', 'bar', ...localMethodNames], 19),
            suggestion('', ['foo', 'bar', ...localMethodNames], 21)
        ],
        '.foo.|//|': [
            suggestion('', ['a', 'b', 'c', 'd', ...localMethodNames], 5),
            null
        ],
        '.foo.|/*|*/|': [
            suggestion('', ['a', 'b', 'c', 'd', ...localMethodNames], 5),
            null,
            null
        ]
    });

    it('trailing comma', () => {
        assert.deepEqual(
            suggestQuery('[foo,|]', data),
            [
                suggestion('', ['foo', 'bar', ...localMethodNames], 5)
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
                        suggestion('', ['foo', 'bar', ...localMethodNames], 0),
                        suggestion('', ['foo', 'bar', ...localMethodNames], 1),
                        suggestion('', ['foo', 'bar', ...localMethodNames], operator.length + 1),
                        suggestion('', ['foo', 'bar', ...localMethodNames], operator.length + 2)
                    ]
                );
            });
        });

        // a separate test for `<` since it may to be the beginning of function
        it('foo <| |', () => {
            assert.deepEqual(
                suggestQuery('foo <| |', data),
                [
                    suggestion('', ['foo', 'bar', ...localMethodNames], 5),
                    suggestion('', ['foo', 'bar', ...localMethodNames], 6)
                ]
            );
        });
    });

    describe('pipeline operator', () => {
        it('| |<pipeline-op>', () => {
            assert.deepEqual(
                suggestQuery('| |<pipeline-op>', data),
                [
                    suggestion('', ['foo', 'bar', ...localMethodNames], 0),
                    suggestion('', ['foo', 'bar', ...localMethodNames], 1)
                ]
            );
        });
        it('$ <pipeline-op>| |', () => {
            assert.deepEqual(
                suggestQuery('$ <pipeline-op>| |', data),
                [
                    suggestion('', ['foo', 'bar', ...localMethodNames], 3),
                    suggestion('', ['foo', 'bar', ...localMethodNames], 4)
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
                                suggestion('', ['foo', 'bar', ...localMethodNames], 0),
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
                                suggestion('', ['foo', 'bar', ...localMethodNames], 0),
                                null
                            ]
                    );
                });
            })
        );

        describe('array before keyword', () =>
            keywords.forEach(operator => {
                const queryString = '|[|]|' + operator;

                if (operator === 'not' ||
                    operator === 'no' ||
                    operator === 'asc' ||
                    operator === 'desc') {
                    return;
                }

                it(queryString, () => {
                    assert.deepEqual(
                        suggestQuery(queryString, data),
                        [
                            null,
                            suggestion('', ['foo', 'bar', ...localMethodNames], 1),
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
                                suggestion('', ['foo', 'bar', ...localMethodNames], 0),
                                suggestion('', ['foo', 'bar', ...localMethodNames], 1),
                                null,
                                suggestion('', ['foo', 'bar', ...localMethodNames], 8),
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
                                suggestion('', ['foo', 'bar', ...localMethodNames], operator.length + 1)
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
                                suggestion('', ['foo', 'bar', ...localMethodNames], operator.length + 1)
                            ]
                    );
                });
            })
        );

        describe('array after keyword', () =>
            ensureRightExprEvaluate.forEach(operator => {
                if (operator === 'asc' || operator === 'desc') {
                    return;
                }

                it(operator + '|[|]', () => {
                    assert.deepEqual(
                        suggestQuery(operator + '|[|]', data),
                        [
                            null,
                            suggestion('', ['foo', 'bar', ...localMethodNames], operator.length + 1)
                        ]
                    );
                });
            })
        );
    });

    describeCasesTolerant('suggestion before and after operators in blocks', {
        '[| |or| |]': [
            suggestion('', ['foo', 'bar', ...localMethodNames], 1),
            null,
            null,
            suggestion('', ['foo', 'bar', ...localMethodNames], 5)
        ],
        '(| |or| |)': [
            suggestion('', ['foo', 'bar', ...localMethodNames], 1),
            null,
            null,
            suggestion('', ['foo', 'bar', ...localMethodNames], 5)
        ],
        '.(| |or| |)': [
            suggestion('', ['foo', 'bar', ...localMethodNames], 2),
            null,
            null,
            suggestion('', ['foo', 'bar', ...localMethodNames], 6)
        ],
        '.[| |or| |]': [
            suggestion('', ['foo', 'bar', ...localMethodNames], 2),
            null,
            null,
            suggestion('', ['foo', 'bar', ...localMethodNames], 6)
        ],
        '..(| |or| |)': [
            suggestion('', ['foo', 'bar', ...localMethodNames], 3),
            null,
            null,
            suggestion('', ['foo', 'bar', ...localMethodNames], 7)
        ]
    });

    describe('value suggestion', () => {
        describe('in', () => {
            Object.entries({
                '|_| |i|n| ["a", "b", 3]': [
                    suggestion('_', ['"a":value', '"b":value', '3:value', 'foo', 'bar', ...localMethodNames], 0, 1),
                    suggestion('_', ['"a":value', '"b":value', '3:value', 'foo', 'bar', ...localMethodNames], 0, 1),
                    null,
                    null,
                    null
                ],
                '|_| |i|n| { "a": 1, "b": 2 }': [
                    suggestion('_', ['"a":value', '"b":value', 'foo', 'bar', ...localMethodNames], 0, 1),
                    suggestion('_', ['"a":value', '"b":value', 'foo', 'bar', ...localMethodNames], 0, 1),
                    null,
                    null,
                    null
                ],
                'keys().[$ in [| |]]': [
                    suggestion('', ['"foo":value', '"bar":value', ...localMethodNames], 14),
                    suggestion('', ['"foo":value', '"bar":value', ...localMethodNames], 15)
                ],
                'foo.[b in [| |]]': [
                    suggestion('', ['2:value', '3:value', 'a', 'b', 'c', 'd', ...localMethodNames], 11),
                    suggestion('', ['2:value', '3:value', 'a', 'b', 'c', 'd', ...localMethodNames], 12)
                ],
                // FIXME: split in several test cases
                '["a", "b", "c", "d", 1, 2].[$a:"a"; $ in [| |"|b|"|,| |d|,| |1|,| |$|a|,| |]]': [
                    null,
                    suggestion('"b"', ['"a":value', '"c":value', '"d":value', '2:value'], 43, 46),
                    suggestion('"b"', ['"a":value', '"c":value', '"d":value', '2:value'], 43, 46),
                    suggestion('"b"', ['"a":value', '"c":value', '"d":value', '2:value'], 43, 46),
                    suggestion('"b"', ['"a":value', '"c":value', '"d":value', '2:value'], 43, 46),
                    null,
                    suggestion('d', ['"a":value', '"c":value', '"d":value', '2:value', '$a:variable', ...localMethodNames], 48, 49),
                    suggestion('d', ['"a":value', '"c":value', '"d":value', '2:value', '$a:variable', ...localMethodNames], 48, 49),
                    null,
                    suggestion('1', ['"a":value', '"c":value', '"d":value', '2:value'], 51, 52),
                    suggestion('1', ['"a":value', '"c":value', '"d":value', '2:value'], 51, 52),
                    null,
                    suggestion('$a', ['$a:variable'], 54, 56),
                    suggestion('$a', ['$a:variable'], 54, 56),
                    suggestion('$a', ['$a:variable'], 54, 56),
                    suggestion('', ['"a":value', '"c":value', '"d":value', '2:value', '$a:variable', ...localMethodNames], 57),
                    suggestion('', ['"a":value', '"c":value', '"d":value', '2:value', '$a:variable', ...localMethodNames], 58)
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
                'keys().[$ not in [| |]]': [
                    suggestion('', ['"foo":value', '"bar":value', ...localMethodNames], 18),
                    suggestion('', ['"foo":value', '"bar":value', ...localMethodNames], 19)
                ],
                'foo.[b not in [| |]]': [
                    suggestion('', ['2:value', '3:value', 'a', 'b', 'c', 'd', ...localMethodNames], 15),
                    suggestion('', ['2:value', '3:value', 'a', 'b', 'c', 'd', ...localMethodNames], 16)
                ],
                // FIXME: split in several test cases
                '["a", "b", "c", "d", 1, 2].[$a:"a"; $ not in [| |"|b|"|,| |d|,| |1|,| |$|a|,| |]]': [
                    null,
                    suggestion('"b"', ['"a":value', '"c":value', '"d":value', '2:value'], 47, 50),
                    suggestion('"b"', ['"a":value', '"c":value', '"d":value', '2:value'], 47, 50),
                    suggestion('"b"', ['"a":value', '"c":value', '"d":value', '2:value'], 47, 50),
                    suggestion('"b"', ['"a":value', '"c":value', '"d":value', '2:value'], 47, 50),
                    null,
                    suggestion('d', ['"a":value', '"c":value', '"d":value', '2:value', '$a:variable', ...localMethodNames], 52, 53),
                    suggestion('d', ['"a":value', '"c":value', '"d":value', '2:value', '$a:variable', ...localMethodNames], 52, 53),
                    null,
                    suggestion('1', ['"a":value', '"c":value', '"d":value', '2:value'], 55, 56),
                    suggestion('1', ['"a":value', '"c":value', '"d":value', '2:value'], 55, 56),
                    null,
                    suggestion('$a', ['$a:variable'], 58, 60),
                    suggestion('$a', ['$a:variable'], 58, 60),
                    suggestion('$a', ['$a:variable'], 58, 60),
                    suggestion('', ['"a":value', '"c":value', '"d":value', '2:value', '$a:variable', ...localMethodNames], 61),
                    suggestion('', ['"a":value', '"c":value', '"d":value', '2:value', '$a:variable', ...localMethodNames], 62)
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
                    suggestion('_', ['"a":value', '"b":value', '3:value', 'foo', 'bar', ...localMethodNames], 18, 19),
                    suggestion('_', ['"a":value', '"b":value', '3:value', 'foo', 'bar', ...localMethodNames], 18, 19)
                ],
                '{ "a": 1, "b": 2 } |h|a|s| |_|': [
                    null,
                    null,
                    null,
                    null,
                    suggestion('_', ['"a":value', '"b":value', 'foo', 'bar', ...localMethodNames], 23, 24),
                    suggestion('_', ['"a":value', '"b":value', 'foo', 'bar', ...localMethodNames], 23, 24)
                ],
                'keys().[[| |] has $]': [
                    suggestion('', ['"foo":value', '"bar":value', ...localMethodNames], 9),
                    suggestion('', ['"foo":value', '"bar":value', ...localMethodNames], 10)
                ],
                'foo.[[| |] has b]': [
                    suggestion('', ['2:value', '3:value', 'a', 'b', 'c', 'd', ...localMethodNames], 6),
                    suggestion('', ['2:value', '3:value', 'a', 'b', 'c', 'd', ...localMethodNames], 7)
                ],
                // FIXME: split in several test cases
                '["a", "b", "c", "d", 1, 2].[$a:"a";[| |"|b|"|,| |d|,| |1|,| |$|a|,| |] has $]': [
                    null,
                    suggestion('"b"', ['"a":value', '"c":value', '"d":value', '2:value'], 37, 40),
                    suggestion('"b"', ['"a":value', '"c":value', '"d":value', '2:value'], 37, 40),
                    suggestion('"b"', ['"a":value', '"c":value', '"d":value', '2:value'], 37, 40),
                    suggestion('"b"', ['"a":value', '"c":value', '"d":value', '2:value'], 37, 40),
                    null,
                    suggestion('d', ['"a":value', '"c":value', '"d":value', '2:value', '$a:variable', ...localMethodNames], 42, 43),
                    suggestion('d', ['"a":value', '"c":value', '"d":value', '2:value', '$a:variable', ...localMethodNames], 42, 43),
                    null,
                    suggestion('1', ['"a":value', '"c":value', '"d":value', '2:value'], 45, 46),
                    suggestion('1', ['"a":value', '"c":value', '"d":value', '2:value'], 45, 46),
                    null,
                    suggestion('$a', ['$a:variable'], 48, 50),
                    suggestion('$a', ['$a:variable'], 48, 50),
                    suggestion('$a', ['$a:variable'], 48, 50),
                    suggestion('', ['"a":value', '"c":value', '"d":value', '2:value', '$a:variable', ...localMethodNames], 51),
                    suggestion('', ['"a":value', '"c":value', '"d":value', '2:value', '$a:variable', ...localMethodNames], 52)
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
                'keys().[[| |] has no $]': [
                    suggestion('', ['"foo":value', '"bar":value', ...localMethodNames], 9),
                    suggestion('', ['"foo":value', '"bar":value', ...localMethodNames], 10)
                ],
                'foo.[[| |] has no b]': [
                    suggestion('', ['2:value', '3:value', 'a', 'b', 'c', 'd', ...localMethodNames], 6),
                    suggestion('', ['2:value', '3:value', 'a', 'b', 'c', 'd', ...localMethodNames], 7)
                ],
                // FIXME: split in several test cases
                '["a", "b", "c", "d", 1, 2].[$a:"a";[| |"|b|"|,| |d|,| |1|,| |$|a|,| |] has no $]': [
                    null,
                    suggestion('"b"', ['"a":value', '"c":value', '"d":value', '2:value'], 37, 40),
                    suggestion('"b"', ['"a":value', '"c":value', '"d":value', '2:value'], 37, 40),
                    suggestion('"b"', ['"a":value', '"c":value', '"d":value', '2:value'], 37, 40),
                    suggestion('"b"', ['"a":value', '"c":value', '"d":value', '2:value'], 37, 40),
                    null,
                    suggestion('d', ['"a":value', '"c":value', '"d":value', '2:value', '$a:variable', ...localMethodNames], 42, 43),
                    suggestion('d', ['"a":value', '"c":value', '"d":value', '2:value', '$a:variable', ...localMethodNames], 42, 43),
                    null,
                    suggestion('1', ['"a":value', '"c":value', '"d":value', '2:value'], 45, 46),
                    suggestion('1', ['"a":value', '"c":value', '"d":value', '2:value'], 45, 46),
                    null,
                    suggestion('$a', ['$a:variable'], 48, 50),
                    suggestion('$a', ['$a:variable'], 48, 50),
                    suggestion('$a', ['$a:variable'], 48, 50),
                    suggestion('', ['"a":value', '"c":value', '"d":value', '2:value', '$a:variable', ...localMethodNames], 51),
                    suggestion('', ['"a":value', '"c":value', '"d":value', '2:value', '$a:variable', ...localMethodNames], 52)
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
            const queryString = 'foo.[b ' + operator + '| |]';
            it(queryString, () => {
                assert.deepEqual(
                    suggestQuery(queryString, data),
                    [
                        suggestion('', ['2:value', '3:value', 'a', 'b', 'c', 'd', ...localMethodNames], queryString.length - 4),
                        suggestion('', ['2:value', '3:value', 'a', 'b', 'c', 'd', ...localMethodNames], queryString.length - 3)
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
                        suggestion('', ['foo', 'bar', ...localMethodNames], queryString.indexOf('|'))
                    ]
                );
            });
        });
    });

    describeCasesTolerant('ternary operator', {
        '1?|': [
            suggestion('', ['foo', 'bar', ...localMethodNames], 2, 2)
        ],
        '1?:|': [
            suggestion('', ['foo', 'bar', ...localMethodNames], 3, 3)
        ]
    });

    describeCasesTolerant('variables', {
        '|$|;|': [
            suggestion('$', ['foo', 'bar', ...localMethodNames], 0, 1),
            suggestion('$', ['foo', 'bar', ...localMethodNames], 0, 1),
            suggestion('', ['foo', 'bar', ...localMethodNames], 2)
        ],
        '| |$| |;| |': [
            null,
            suggestion('$', ['foo', 'bar', ...localMethodNames], 1, 2),
            suggestion('$', ['foo', 'bar', ...localMethodNames], 1, 2),
            null,
            suggestion('', ['foo', 'bar', ...localMethodNames], 4),
            suggestion('', ['foo', 'bar', ...localMethodNames], 5)
        ],
        '$|v|a|r|:|;|': [
            null,
            null,
            null,
            null,
            suggestion('', ['foo', 'bar', ...localMethodNames], 5),
            suggestion('', ['$var:variable', 'foo', 'bar', ...localMethodNames], 6)
        ],
        '$foo;$var:|;|': [
            suggestion('', ['$foo:variable', 'foo', 'bar', ...localMethodNames], 10),
            suggestion('', ['$foo:variable', '$var:variable', 'foo', 'bar', ...localMethodNames], 11)
        ],
        '$|x|:|$|;|$|x|.|': [
            null,
            null,
            null,
            null,
            suggestion('$x', ['$x:variable'], 5, 7),
            suggestion('$x', ['$x:variable'], 5, 7),
            suggestion('$x', ['$x:variable'], 5, 7),
            suggestion('', ['foo', 'bar', ...localMethodNames], 8, 8)
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
            suggestion('', ['qux', ...localMethodNames], 23, 23)
        ],
        '{x:|$|}.x.|': [
            null,
            null,
            suggestion('', ['foo', 'bar', ...localMethodNames], 8)
        ],
        '$_:{ a: 1, b: 2 };{$|}.|': [
            suggestion('$', ['$_:variable'], 19, 20),
            suggestion('', [...localMethodNames], 22, 22)
        ],
        '$foo;{| |$|f|,| |f| |}': [
            null,
            suggestion('$f', ['$foo:variable'], 7, 9),
            suggestion('$f', ['$foo:variable'], 7, 9),
            suggestion('$f', ['$foo:variable'], 7, 9),
            null,
            suggestion('f', ['$foo:variable', 'foo', 'bar', ...localMethodNames], 11, 12),
            suggestion('f', ['$foo:variable', 'foo', 'bar', ...localMethodNames], 11, 12),
            null
        ],
        '$[| |$|a| |]': [
            null,
            suggestion('$a', ['"foo":value', '"bar":value'], 3, 5),
            suggestion('$a', ['"foo":value', '"bar":value'], 3, 5),
            suggestion('$a', ['"foo":value', '"bar":value'], 3, 5),
            null
        ],
        '$[=> $$ =| |]': [
            suggestion('', ['"foo":value', '"bar":value', 'a', 'b', 'c', 'd', ...localMethodNames], 9, 9),
            suggestion('', ['"foo":value', '"bar":value', 'a', 'b', 'c', 'd', ...localMethodNames], 10, 10)
        ],
        '`${| |.| |}`': [
            suggestion('', ['foo', 'bar', ...localMethodNames], 3, 3),
            suggestion('', ['foo', 'bar', ...localMethodNames], 4, 4),
            suggestion('', ['foo', 'bar', ...localMethodNames], 5, 5),
            suggestion('', ['foo', 'bar', ...localMethodNames], 6, 6)
        ],
        '`${| |.| |}${}`': [
            suggestion('', ['foo', 'bar', ...localMethodNames], 3, 3),
            suggestion('', ['foo', 'bar', ...localMethodNames], 4, 4),
            suggestion('', ['foo', 'bar', ...localMethodNames], 5, 5),
            suggestion('', ['foo', 'bar', ...localMethodNames], 6, 6)
        ],
        '`${}${| |.| |}`': [
            suggestion('', ['foo', 'bar', ...localMethodNames], 6, 6),
            suggestion('', ['foo', 'bar', ...localMethodNames], 7, 7),
            suggestion('', ['foo', 'bar', ...localMethodNames], 8, 8),
            suggestion('', ['foo', 'bar', ...localMethodNames], 9, 9)
        ]
    });
});
