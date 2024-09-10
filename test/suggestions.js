import assert from 'assert';
import query from 'jora';

const assertions = Object.keys(query.assertions).map(value => value + ':assertion');
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

function suggestQuery(str, data, options, limitSort = false) {
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

    return suggestPoints.map(idx => linearSuggestions(
        stat.suggestion(idx, limitSort ? { limit: 50, sort: true } : undefined)
    ));
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

function describeCasesWithOptions(title, options, cases, queryData = data) {
    describe(title, () => {
        Object.entries(cases).forEach(([queryString, expected]) => {
            (queryString[0] === '!' ? it.skip : it)(queryString, () => {
                assert.deepEqual(
                    suggestQuery(queryString, queryData, options),
                    expected
                );
            });
            (queryString[0] === '!' ? it.skip : it)(queryString + ' // limit & sort', () => {
                assert.deepEqual(
                    suggestQuery(queryString, queryData, options, true),
                    expected.slice().map(variants =>
                        // use methods.sort() since it provides stable sorting for old engines
                        variants && query.methods.sort(variants, (a, b) => a.type !== b.type
                            ? 0
                            : a.type === 'value'
                                ? query.buildin.cmp(JSON.parse(a.value), JSON.parse(b.value))
                                : query.buildin.cmp(a.value, b.value))
                    )
                );
            });
        });
    });
}

function describeCases(title, cases, queryData) {
    return describeCasesWithOptions(title, { tolerant: false }, cases, queryData);
}

function describeCasesTolerant(title, cases, queryData) {
    return describeCasesWithOptions(title, { tolerant: true }, cases, queryData);
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

    describeCases('object context', {
        '{| |a|,| |b| |}': [
            null,
            suggestion('a', ['foo', 'bar'], 2, 3),
            suggestion('a', ['foo', 'bar'], 2, 3),
            null,
            suggestion('b', ['foo', 'bar'], 5, 6),
            suggestion('b', ['foo', 'bar'], 5, 6),
            null
        ],
        '$a123:1;{ 1234: 2 } <pipeline-op> {| |12|3| |}': [
            null,
            suggestion('123', ['$a123:variable', '1234'], 24, 27),
            suggestion('123', ['$a123:variable', '1234'], 24, 27),
            suggestion('123', ['$a123:variable', '1234'], 24, 27),
            null
        ],
        '$stra:1;{ strb: 123 } <pipeline-op> {| |"|st|r|"| |}': [
            null,
            suggestion('"str"', ['$stra:variable', 'strb'], 26, 31),
            suggestion('"str"', ['$stra:variable', 'strb'], 26, 31),
            suggestion('"str"', ['$stra:variable', 'strb'], 26, 31),
            suggestion('"str"', ['$stra:variable', 'strb'], 26, 31),
            suggestion('"str"', ['$stra:variable', 'strb'], 26, 31),
            null
        ],
        '$nulla:1;{ nullb: 123 } <pipeline-op> {| |nul|l| |}': [
            null,
            suggestion('null', ['$nulla:variable', 'nullb'], 28, 32),
            suggestion('null', ['$nulla:variable', 'nullb'], 28, 32),
            suggestion('null', ['$nulla:variable', 'nullb'], 28, 32),
            null
        ]
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

    describeCases('function context', {
        'map(|=|>|a|)': [
            null,
            null,
            suggestion('a', ['foo', 'bar'], 6, 7),
            suggestion('a', ['foo', 'bar'], 6, 7)
        ],
        'map(|=|>|1|)': [
            null,
            null,
            null,
            null
        ],
        'map(=>|1|?|:|)': [
            null,
            null,
            suggestion('', ['foo', 'bar'], 8, 8),
            null
        ],
        'map(=>|foo|?|:|)': [
            suggestion('foo', ['foo', 'bar'], 6, 9),
            suggestion('foo', ['foo', 'bar'], 6, 9),
            suggestion('', ['foo', 'bar'], 10, 10),
            null
        ],
        'foo.map(=>a|?|:|)': [
            suggestion('a', ['a', 'b', 'c', 'd'], 10, 11),
            suggestion('', ['a', 'b'], 12, 12),
            suggestion('', ['b', 'c', 'd'], 13, 13)
        ]
    });

    describeCases('comparator functions', {
        'sort(|a| |asc)': [
            suggestion('a', ['a', 'b'], 5, 6),
            suggestion('a', ['a', 'b'], 5, 6),
            null
        ],
        'sort(|a|?|:| |asc)': [
            suggestion('a', ['a', 'b'], 5, 6),
            suggestion('a', ['a', 'b'], 5, 6),
            suggestion('', ['a', 'b'], 7, 7),
            null,
            null
        ],
        'sort(|b|?|c|:|d| |asc)': [
            suggestion('b', ['a', 'b'], 5, 6),
            suggestion('b', ['a', 'b'], 5, 6),
            suggestion('c', ['a', 'b'], 7, 8),
            suggestion('c', ['a', 'b'], 7, 8),
            suggestion('d', ['a'], 9, 10),
            suggestion('d', ['a'], 9, 10),
            null
        ],
        'sort(0?|:| |asc)': [
            null,
            suggestion('', ['a', 'b'], 8, 8),
            null
        ],
        'sort(is array?|a|:|b| |asc)': [
            null,
            null,
            suggestion('b', ['a', 'b'], 16, 17),
            suggestion('b', ['a', 'b'], 16, 17),
            null
        ],
        '[1,2].sort(is array?|a|:|b| |asc)': [
            null,
            null,
            null,
            null,
            null
        ]
    }, [{ a: 1 }, { a: 5, b: 1 }, { a: 2 }]);

    describeCases('pick', {
        '$[| |]': [
            suggestion('', ['"foo":value', '"bar":value', 'foo', 'bar'], 2, 2),
            suggestion('', ['"foo":value', '"bar":value', 'foo', 'bar'], 3, 3)
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
            suggestion('a', ['"foo":value', '"bar":value', 'foo', 'bar'], 3, 4),
            suggestion('a', ['"foo":value', '"bar":value', 'foo', 'bar'], 3, 4),
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
        ]
    });

    describeCases('ternary operator', {
        '1?|': [
            suggestion('', ['foo', 'bar'], 2, 2)
        ],
        '1?|:|': [
            suggestion('', ['foo', 'bar'], 2, 2),
            null
        ],
        '0?|:|': [
            null,
            suggestion('', ['foo', 'bar'], 3, 3)
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
    describeCasesTolerant('trailing full stop', {
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
                    suggestQuery(queryString, data), [
                        suggestion('', ['foo', 'bar'], 1)
                    ]
                );
            });
        });
    });

    describeCasesTolerant('trailing double full stop', {
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

    describeCasesTolerant('trailing full stop with trailing whitespaces', {
        '.| |': [
            suggestion('', ['foo', 'bar'], 1),
            suggestion('', ['foo', 'bar'], 2)
        ],
        '.|\n  ': [
            suggestion('', ['foo', 'bar'], 1)
        ]
    });

    describeCasesTolerant('trailing full stop with trailing comment', {
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
            ensureRightExprEvaluate.forEach(operator => {
                if (operator === 'asc' || operator === 'desc') {
                    return;
                }

                it(operator + '|[|]', () => {
                    assert.deepEqual(
                        suggestQuery(operator + '|[|]', data),
                        [
                            null,
                            suggestion('', ['foo', 'bar'], operator.length + 1)
                        ]
                    );
                });
            })
        );
    });

    describeCasesTolerant('blocks', {
        '[| | |]': [
            suggestion('', ['foo', 'bar'], 1),
            suggestion('', ['foo', 'bar'], 2),
            suggestion('', ['foo', 'bar'], 3)
        ],
        '(| | |)': [
            suggestion('', ['foo', 'bar'], 1),
            suggestion('', ['foo', 'bar'], 2),
            suggestion('', ['foo', 'bar'], 3)
        ],
        '.(| | |)': [
            suggestion('', ['foo', 'bar'], 2),
            suggestion('', ['foo', 'bar'], 3),
            suggestion('', ['foo', 'bar'], 4)
        ],
        '.[| | |]': [
            suggestion('', ['foo', 'bar'], 2),
            suggestion('', ['foo', 'bar'], 3),
            suggestion('', ['foo', 'bar'], 4)
        ],
        '..(| | |)': [
            suggestion('', ['foo', 'bar'], 3),
            suggestion('', ['foo', 'bar'], 4),
            suggestion('', ['foo', 'bar'], 5)
        ]
    });

    describeCasesTolerant('suggestion before and after operators in blocks', {
        '[| |or| |]': [
            suggestion('', ['foo', 'bar'], 1),
            null,
            null,
            suggestion('', ['foo', 'bar'], 5)
        ],
        '(| |or| |)': [
            suggestion('', ['foo', 'bar'], 1),
            null,
            null,
            suggestion('', ['foo', 'bar'], 5)
        ],
        '.(| |or| |)': [
            suggestion('', ['foo', 'bar'], 2),
            null,
            null,
            suggestion('', ['foo', 'bar'], 6)
        ],
        '.[| |or| |]': [
            suggestion('', ['foo', 'bar'], 2),
            null,
            null,
            suggestion('', ['foo', 'bar'], 6)
        ],
        '..(| |or| |)': [
            suggestion('', ['foo', 'bar'], 3),
            null,
            null,
            suggestion('', ['foo', 'bar'], 7)
        ]
    });

    describeCasesTolerant('functions', {
        'map(|=|>|)': [
            null,
            null,
            suggestion('', ['foo', 'bar'], 6, 6)
        ],
        'map(|=|>|a|)': [
            null,
            null,
            suggestion('a', ['foo', 'bar'], 6, 7),
            suggestion('a', ['foo', 'bar'], 6, 7)
        ],
        'map(|=|>|1|)': [
            null,
            null,
            null,
            null
        ],
        'map(|=|>|1|?|:|)': [
            null,
            null,
            null,
            null,
            suggestion('', ['foo', 'bar'], 8, 8),
            null
        ],
        'map(=>|foo|?|:|)': [
            suggestion('foo', ['foo', 'bar'], 6, 9),
            suggestion('foo', ['foo', 'bar'], 6, 9),
            suggestion('', ['foo', 'bar'], 10, 10),
            null
        ],
        'foo.map(=>a|?|:|)': [
            suggestion('a', ['a', 'b', 'c', 'd'], 10, 11),
            suggestion('', ['a', 'b'], 12, 12),
            suggestion('', ['b', 'c', 'd'], 13, 13)
        ]
    });

    describeCasesTolerant('comparator functions', {
        'sort(|a| |asc)': [
            suggestion('a', ['a', 'b'], 5, 6),
            suggestion('a', ['a', 'b'], 5, 6),
            null
        ],
        'sort(|a|?|:| |asc)': [
            suggestion('a', ['a', 'b'], 5, 6),
            suggestion('a', ['a', 'b'], 5, 6),
            suggestion('', ['a', 'b'], 7, 7),
            null,
            null
        ],
        'sort(|b|?|c|:|d| |asc)': [
            suggestion('b', ['a', 'b'], 5, 6),
            suggestion('b', ['a', 'b'], 5, 6),
            suggestion('c', ['a', 'b'], 7, 8),
            suggestion('c', ['a', 'b'], 7, 8),
            suggestion('d', ['a'], 9, 10),
            suggestion('d', ['a'], 9, 10),
            null
        ],
        'sort(0?|:| |asc)': [
            null,
            suggestion('', ['a', 'b'], 8, 8),
            null
        ],
        'sort(is array?|a|:|b| |asc)': [
            null,
            null,
            suggestion('b', ['a', 'b'], 16, 17),
            suggestion('b', ['a', 'b'], 16, 17),
            null
        ],
        '[1,2].sort(is array?|a|:|size()| |asc)': [
            null,
            null,
            null,
            null,
            null
        ]
    }, [{ a: 1 }, { a: 5, b: 1 }, { a: 2 }]);

    describeCasesTolerant('assertions', {
        'is| |': [
            null,
            suggestion('', assertions, 3)
        ],
        '$a:1;is| |': [
            null,
            suggestion('', ['$a:variable', ...assertions], 8)
        ],
        'is| |(| |)': [
            null,
            null,
            suggestion('', assertions, 4),
            suggestion('', assertions, 5)
        ]
    });

    describe('value suggestion', () => {
        describeCasesTolerant('in', {
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
            'keys().[$ in [| |]]': [
                suggestion('', ['"foo":value', '"bar":value'], 14),
                suggestion('', ['"foo":value', '"bar":value'], 15)
            ],
            'foo.[b in [| |]]': [
                suggestion('', ['2:value', '3:value', 'a', 'b', 'c', 'd'], 11),
                suggestion('', ['2:value', '3:value', 'a', 'b', 'c', 'd'], 12)
            ],
            // FIXME: split in several test cases
            '["a", "b", "c", "d", 1, 2].[$a:"a"; $ in [| |"|b|"|,| |d|,| |1|,| |$|a|,| |]]': [
                null,
                suggestion('"b"', ['"a":value', '"c":value', '"d":value', '2:value'], 43, 46),
                suggestion('"b"', ['"a":value', '"c":value', '"d":value', '2:value'], 43, 46),
                suggestion('"b"', ['"a":value', '"c":value', '"d":value', '2:value'], 43, 46),
                suggestion('"b"', ['"a":value', '"c":value', '"d":value', '2:value'], 43, 46),
                null,
                suggestion('d', ['"a":value', '"c":value', '"d":value', '2:value', '$a:variable'], 48, 49),
                suggestion('d', ['"a":value', '"c":value', '"d":value', '2:value', '$a:variable'], 48, 49),
                null,
                suggestion('1', ['"a":value', '"c":value', '"d":value', '2:value'], 51, 52),
                suggestion('1', ['"a":value', '"c":value', '"d":value', '2:value'], 51, 52),
                null,
                suggestion('$a', ['$a:variable'], 54, 56),
                suggestion('$a', ['$a:variable'], 54, 56),
                suggestion('$a', ['$a:variable'], 54, 56),
                suggestion('', ['"a":value', '"c":value', '"d":value', '2:value', '$a:variable'], 57),
                suggestion('', ['"a":value', '"c":value', '"d":value', '2:value', '$a:variable'], 58)
            ]
        });

        describeCasesTolerant('not in', {
            'keys().[$ not in [| |]]': [
                suggestion('', ['"foo":value', '"bar":value'], 18),
                suggestion('', ['"foo":value', '"bar":value'], 19)
            ],
            'foo.[b not in [| |]]': [
                suggestion('', ['2:value', '3:value', 'a', 'b', 'c', 'd'], 15),
                suggestion('', ['2:value', '3:value', 'a', 'b', 'c', 'd'], 16)
            ],
            // FIXME: split in several test cases
            '["a", "b", "c", "d", 1, 2].[$a:"a"; $ not in [| |"|b|"|,| |d|,| |1|,| |$|a|,| |]]': [
                null,
                suggestion('"b"', ['"a":value', '"c":value', '"d":value', '2:value'], 47, 50),
                suggestion('"b"', ['"a":value', '"c":value', '"d":value', '2:value'], 47, 50),
                suggestion('"b"', ['"a":value', '"c":value', '"d":value', '2:value'], 47, 50),
                suggestion('"b"', ['"a":value', '"c":value', '"d":value', '2:value'], 47, 50),
                null,
                suggestion('d', ['"a":value', '"c":value', '"d":value', '2:value', '$a:variable'], 52, 53),
                suggestion('d', ['"a":value', '"c":value', '"d":value', '2:value', '$a:variable'], 52, 53),
                null,
                suggestion('1', ['"a":value', '"c":value', '"d":value', '2:value'], 55, 56),
                suggestion('1', ['"a":value', '"c":value', '"d":value', '2:value'], 55, 56),
                null,
                suggestion('$a', ['$a:variable'], 58, 60),
                suggestion('$a', ['$a:variable'], 58, 60),
                suggestion('$a', ['$a:variable'], 58, 60),
                suggestion('', ['"a":value', '"c":value', '"d":value', '2:value', '$a:variable'], 61),
                suggestion('', ['"a":value', '"c":value', '"d":value', '2:value', '$a:variable'], 62)
            ]
        });

        describeCasesTolerant('has', {
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
            'keys().[[| |] has $]': [
                suggestion('', ['"foo":value', '"bar":value'], 9),
                suggestion('', ['"foo":value', '"bar":value'], 10)
            ],
            'foo.[[| |] has b]': [
                suggestion('', ['2:value', '3:value', 'a', 'b', 'c', 'd'], 6),
                suggestion('', ['2:value', '3:value', 'a', 'b', 'c', 'd'], 7)
            ],
            // duplicate values
            '[1, 2, 3].[["abc"] has |]': [
                suggestion('', ['"abc":value'], 23)
            ],
            // FIXME: split in several test cases
            '["a", "b", "c", "d", 1, 2].[$a:"a";[| |"|b|"|,| |d|,| |1|,| |$|a|,| |] has $]': [
                null,
                suggestion('"b"', ['"a":value', '"c":value', '"d":value', '2:value'], 37, 40),
                suggestion('"b"', ['"a":value', '"c":value', '"d":value', '2:value'], 37, 40),
                suggestion('"b"', ['"a":value', '"c":value', '"d":value', '2:value'], 37, 40),
                suggestion('"b"', ['"a":value', '"c":value', '"d":value', '2:value'], 37, 40),
                null,
                suggestion('d', ['"a":value', '"c":value', '"d":value', '2:value', '$a:variable'], 42, 43),
                suggestion('d', ['"a":value', '"c":value', '"d":value', '2:value', '$a:variable'], 42, 43),
                null,
                suggestion('1', ['"a":value', '"c":value', '"d":value', '2:value'], 45, 46),
                suggestion('1', ['"a":value', '"c":value', '"d":value', '2:value'], 45, 46),
                null,
                suggestion('$a', ['$a:variable'], 48, 50),
                suggestion('$a', ['$a:variable'], 48, 50),
                suggestion('$a', ['$a:variable'], 48, 50),
                suggestion('', ['"a":value', '"c":value', '"d":value', '2:value', '$a:variable'], 51),
                suggestion('', ['"a":value', '"c":value', '"d":value', '2:value', '$a:variable'], 52)
            ]
        });

        it('has with TypedArray', () => {
            assert.deepEqual(
                suggestQuery('$ has |', new Uint8Array([1, 2, 5, 9])),
                [
                    suggestion('', ['1:value', '2:value', '5:value', '9:value'], 6)
                ]
            );

            assert.deepEqual(
                suggestQuery('| in $', new Uint8Array([1, 2, 5, 9])),
                [
                    suggestion('', ['1:value', '2:value', '5:value', '9:value'], 0)
                ]
            );
        });

        describeCasesTolerant('has no', {
            'keys().[[| |] has no $]': [
                suggestion('', ['"foo":value', '"bar":value'], 9),
                suggestion('', ['"foo":value', '"bar":value'], 10)
            ],
            'foo.[[| |] has no b]': [
                suggestion('', ['2:value', '3:value', 'a', 'b', 'c', 'd'], 6),
                suggestion('', ['2:value', '3:value', 'a', 'b', 'c', 'd'], 7)
            ],
            // FIXME: split in several test cases
            '["a", "b", "c", "d", 1, 2].[$a:"a";[| |"|b|"|,| |d|,| |1|,| |$|a|,| |] has no $]': [
                null,
                suggestion('"b"', ['"a":value', '"c":value', '"d":value', '2:value'], 37, 40),
                suggestion('"b"', ['"a":value', '"c":value', '"d":value', '2:value'], 37, 40),
                suggestion('"b"', ['"a":value', '"c":value', '"d":value', '2:value'], 37, 40),
                suggestion('"b"', ['"a":value', '"c":value', '"d":value', '2:value'], 37, 40),
                null,
                suggestion('d', ['"a":value', '"c":value', '"d":value', '2:value', '$a:variable'], 42, 43),
                suggestion('d', ['"a":value', '"c":value', '"d":value', '2:value', '$a:variable'], 42, 43),
                null,
                suggestion('1', ['"a":value', '"c":value', '"d":value', '2:value'], 45, 46),
                suggestion('1', ['"a":value', '"c":value', '"d":value', '2:value'], 45, 46),
                null,
                suggestion('$a', ['$a:variable'], 48, 50),
                suggestion('$a', ['$a:variable'], 48, 50),
                suggestion('$a', ['$a:variable'], 48, 50),
                suggestion('', ['"a":value', '"c":value', '"d":value', '2:value', '$a:variable'], 51),
                suggestion('', ['"a":value', '"c":value', '"d":value', '2:value', '$a:variable'], 52)
            ]
        });

        ['=', '!='].forEach(operator => {
            const queryString = 'foo.[b ' + operator + '| |]';
            it(queryString, () => {
                assert.deepEqual(
                    suggestQuery(queryString, data),
                    [
                        suggestion('', ['2:value', '3:value', 'a', 'b', 'c', 'd'], queryString.length - 4),
                        suggestion('', ['2:value', '3:value', 'a', 'b', 'c', 'd'], queryString.length - 3)
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

    describeCasesTolerant('ternary operator', {
        '1?|': [
            suggestion('', ['foo', 'bar'], 2, 2)
        ],
        '1?|:|': [
            suggestion('', ['foo', 'bar'], 2, 2),
            null
        ],
        '0?|:|': [
            null,
            suggestion('', ['foo', 'bar'], 3, 3)
        ]
    });

    describeCasesTolerant('variables', {
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
        '$var;$|v|': [
            suggestion('$v', ['$var:variable'], 5, 7),
            suggestion('$v', ['$var:variable'], 5, 7)
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
        '$asd;$a:$a|;$a|': [
            suggestion('$a', ['$asd:variable'], 8, 10),
            suggestion('$a', ['$asd:variable', '$a:variable'], 11, 13)
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
        '$foo;{| |$|f|,| |f| |}': [
            null,
            suggestion('$f', ['$foo:variable'], 7, 9),
            suggestion('$f', ['$foo:variable'], 7, 9),
            suggestion('$f', ['$foo:variable'], 7, 9),
            null,
            suggestion('f', ['$foo:variable', 'foo', 'bar'], 11, 12),
            suggestion('f', ['$foo:variable', 'foo', 'bar'], 11, 12),
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
            suggestion('', ['"foo":value', '"bar":value', 'a', 'b', 'c', 'd'], 9, 9),
            suggestion('', ['"foo":value', '"bar":value', 'a', 'b', 'c', 'd'], 10, 10)
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
