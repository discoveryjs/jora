const { version } = require('../package.json');
const buildin = require('./buildin');
const methods = require('./methods');
const {
    strict: strictParser,
    tolerant: tolerantParser
} = require('./parser');
const { addToSet, isPlainObject } = require('./utils');

const cacheStrict = new Map();
const cacheStrictStat = new Map();
const cacheTollerant = new Map();
const cacheTollerantStat = new Map();
const contextToType = {
    'path': 'property',
    'key': 'property',
    'value': 'value',
    'in-value': 'value',
    'var': 'variable'
};

function isWhiteSpace(str, offset) {
    const code = str.charCodeAt(offset);
    return code === 9 || code === 10 || code === 13 || code === 32;
}

function isSuggestProhibitedChar(str, offset) {
    return (
        offset >= 0 &&
        offset < str.length &&
        /[a-zA-Z_$0-9]/.test(str[offset])
    );
}

function valuesToSuggestions(context, values) {
    const suggestions = new Set();
    const addValue = value => {
        switch (typeof value) {
            case 'string':
                suggestions.add(JSON.stringify(value));
                break;
            case 'number':
                suggestions.add(String(value));
                break;
        }
    };

    switch (context) {
        case '':
        case 'path':
            values.forEach(value => {
                if (Array.isArray(value)) {
                    value.forEach(item => {
                        if (isPlainObject(item)) {
                            addToSet(suggestions, Object.keys(item));
                        }
                    });
                } else if (isPlainObject(value)) {
                    addToSet(suggestions, Object.keys(value));
                }
            });
            break;

        case 'key':
            values.forEach(value => {
                if (isPlainObject(value)) {
                    addToSet(suggestions, Object.keys(value));
                }
            });
            break;

        case 'value':
            values.forEach(value => {
                if (Array.isArray(value)) {
                    value.forEach(addValue);
                } else {
                    addValue(value);
                }
            });
            break;

        case 'in-value':
            values.forEach(value => {
                if (Array.isArray(value)) {
                    value.forEach(addValue);
                } else if (isPlainObject(value)) {
                    Object.keys(value).forEach(addValue);
                } else {
                    addValue(value);
                }
            });
            break;

        case 'var':
            values.forEach(value => {
                suggestions.add('$' + value);
            });
            break;
    }

    return [...suggestions];
}

function findSourcePosPoints(source, pos, points, includeEmpty) {
    const result = [];

    for (let i = 0; i < points.length; i++) {
        const [values, ranges, context] = points[i];

        for (let j = 0; j < ranges.length; j += 2) {
            let from = ranges[j];
            let to = ranges[j + 1];

            if (pos >= from && pos <= to && (includeEmpty || values.size || values.length)) {
                let current = source.substring(from, to);

                if (!/\S/.test(current)) {
                    current = '';
                    from = to = pos;
                }

                result.push({
                    context,
                    current,
                    from,
                    to,
                    values
                });
            }

        }
    }

    return result;
}

function compileFunction(source, statMode, tolerantMode, debug) {
    function getSuggestRanges(from, to) {
        const ranges = [];

        for (let i = 0; i < commentRanges.length; i++) {
            const [commentFrom, commentTo] = commentRanges[i];

            if (commentFrom > to) {
                break;
            }

            if (commentFrom < from) {
                continue;
            }

            if (commentFrom === from) {
                ranges.push(from, from);
            } else {
                ranges.push(from, commentFrom);
            }

            from = commentTo;
        }

        if (from !== source.length || !noSuggestOnEofPos) {
            ranges.push(from, to);
        }

        return ranges;
    }

    function astToCode(node, scopeVars) {
        if (Array.isArray(node)) {
            const first = node[0];
            let varName = false;
            let i = 0;

            if (first === '/*scope*/') {
                // create new scope
                scopeVars = scopeVars.slice();
                i++;
            } else if (typeof first === 'string' && first.startsWith('/*define:')) {
                let [from, to] = first.substring(9, first.length - 2).split(',');
                varName = source.substring(from, to);

                if (scopeVars.includes(`"${varName}"`)) {
                    throw new Error(`Identifier '$${varName}' has already been declared`);
                }

                i++;
            }

            for (; i < node.length; i++) {
                astToCode(node[i], scopeVars);
            }

            if (varName) {
                scopeVars.push(`"${varName}"`);
            }
        } else if (statMode && node.startsWith('/*')) {
            if (node.startsWith('/*var:')) {
                let [from, to] = node.substring(6, node.length - 2).split(',');

                if (from === to) {
                    // when starts on keyword/number/var end
                    if (isSuggestProhibitedChar(source, from - 1)) {
                        return;
                    }

                    // extend a range by white spaces
                    while (to < source.length - 1 && isWhiteSpace(source, to)) {
                        to++;
                    }

                    // when ends on keyword/number/var start
                    if (isSuggestProhibitedChar(source, to)) {
                        if (from === to) {
                            return;
                        }
                        to--;
                    }
                }

                suggestPoints.push(`[[${scopeVars}], [${getSuggestRanges(from, to)}], "var"]`);
            } else if (node.startsWith('/*sp:')) {
                const pointId = suggestSets.push('sp' + suggestSets.length + ' = new Set()') - 1;
                const items = node.substring(5, node.length - 2).split(',');

                // FIXME: position correction should be in parser
                for (let i = 0; i < items.length; i += 3) {
                    let from = Number(items[i]);
                    let to = Number(items[i + 1]);
                    let context = items[i + 2];
                    const frag = source.substring(from, to);

                    if (frag === '.[' || frag === '.(' || frag === '..(' ||
                        frag === '{' || frag === '[' || frag === '(' || frag === '<' ||
                        frag === '...' ||
                        from === to) {
                        from = to;

                        // when starts on keyword/number/var end
                        if (isSuggestProhibitedChar(source, from - 1)) {
                            continue;
                        }

                        // extend a range by white spaces
                        while (to < source.length - 1 && isWhiteSpace(source, to)) {
                            to++;
                        }

                        // when ends on keyword/number/var start
                        if (isSuggestProhibitedChar(source, to)) {
                            if (from === to) {
                                continue;
                            }
                            to--;
                        }
                    }

                    suggestPoints.push(`[sp${pointId}, [${getSuggestRanges(from, to)}], "${context || 'path'}"]`);
                }
                code.push(`suggestPoint(sp${pointId}, `);
            } else if (node === '/**/') {
                code.push(')');
            }
        } else {
            code.push(node);
        }
    }

    if (debug) {
        console.log('\n== compile ======');
        console.log('source:', source);
    }

    const parser = tolerantMode ? tolerantParser : strictParser;
    const { ast, commentRanges } = parser.parse(source);
    const code = [];
    const suggestPoints = [];
    const noSuggestOnEofPos = // edge case when source ends with a comment with no newline
        commentRanges.length &&
        commentRanges[commentRanges.length - 1][1] === source.length &&
        !/[\r\n]$/.test(source);
    let suggestSets = [];
    let body = [];

    // if (debug) {
    //     console.log('ast:', JSON.stringify(ast, null, 4));
    // }

    astToCode(ast, []);

    if (suggestSets.length) {
        body.push(
            'const ' + suggestSets.join(', ') + ';',
            'const suggestPoint = (set, value) => (set.add(value), value);'
        );
    }

    body.push(
        // preserved variables
        'const $data = undefined, $context = undefined, $ctx = undefined, $array = undefined, $idx = undefined, $index = undefined;',
        'let current = data;',
        'let tmp;',
        code.join('')
    );

    if (statMode) {
        body.push(`,[${suggestPoints}]`);
    }

    if (debug) {
        console.log('== body =========\n' + body.join('\n') + '\n=================\n');
    }

    return new Function('fn', 'method', 'data', 'context', 'self', body.join('\n'));
}

function createQuery(source, options) {
    options = options || {};

    const debug = Boolean(options.debug);
    const statMode = Boolean(options.stat);
    const tolerantMode = Boolean(options.tolerant);
    const localMethods = options.methods ? Object.assign({}, methods, options.methods) : methods;
    const cache = statMode
        ? (tolerantMode ? cacheTollerantStat : cacheStrictStat)
        : (tolerantMode ? cacheTollerant : cacheStrict);
    let fn;

    source = String(source);

    if (cache.has(source)) {
        fn = cache.get(source);
    } else {
        fn = compileFunction(source, statMode, tolerantMode, debug);
        cache.set(source, fn);
    }

    if (debug) {
        console.log('fn', fn.toString());
    }

    if (statMode) {
        return function query(data, context) {
            const points = fn(buildin, localMethods, data, context, query);

            return {
                stat(pos, includeEmpty) {
                    const ranges = findSourcePosPoints(source, pos, points, includeEmpty);

                    ranges.forEach(range => {
                        range.values = [...range.values];
                    });

                    return ranges.length ? ranges : null;
                },
                suggestion(pos, includeEmpty) {
                    const suggestions = [];

                    findSourcePosPoints(source, pos, points, includeEmpty).forEach(entry => {
                        const { context, current, from, to, values } = entry;

                        // console.log({current, variants:[...suggestions.get(range)], suggestions })
                        suggestions.push(
                            ...valuesToSuggestions(context, values)
                                .map(value => ({
                                    current,
                                    type: contextToType[context],
                                    value,
                                    from,
                                    to
                                }))
                        );
                    });

                    return suggestions.length ? suggestions : null;
                }
            };
        };
    }

    return function query(data, context) {
        return fn(buildin, localMethods, data, context, query);
    };
};

module.exports = Object.assign(createQuery, {
    version,
    buildin,
    methods
});
