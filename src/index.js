const buildin = require('./buildin');
const methods = require('./methods');
const {
    strict: strictParser,
    tolerant: tolerantParser
} = require('./parser');
const { addToSet, isPlainObject} = require('./utils');

const cacheStrict = new Map();
const cacheStrictStat = new Map();
const cacheTollerant = new Map();
const cacheTollerantStat = new Map();
const contextToType = {
    '': 'property',
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
        let [values, from, to, context] = points[i];

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

    return result;
}

function compileFunction(source, statMode, tolerantMode, debug) {
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
            if (node === '/*s*/') {
                code.push('suggestPoint(');
            } else if (node.startsWith('/*var:')) {
                let [from, to] = node.substring(6, node.length - 2).split(',');

                if (from === to) {
                    while (to < source.length && isWhiteSpace(source, to)) {
                        to++;
                    }
                }

                suggestPoints.push(`[[${scopeVars}], ${from}, ${to}, "var"]`);
            } else {
                const pointId = suggestSets.push('sp' + suggestSets.length + ' = new Set()') - 1;
                const items = node.substring(2, node.length - 2).split(',');

                // FIXME: position correction should be in parser
                for (let i = 0; i < items.length; i += 3) {
                    let from = Number(items[i]);
                    let to = Number(items[i + 1]);
                    let context = items[i + 2];
                    const frag = source.substring(from, to);

                    if (frag === '.[' || frag === '.(' || frag === '..(' ||
                        frag === '{' || frag === '[' || frag === '(' ||
                        from === to) {
                        from = to;
                        while (to < source.length && isWhiteSpace(source, to)) {
                            to++;
                        }
                    }

                    suggestPoints.push(`[sp${pointId}, ${from}, ${to}, "${context}"]`);
                }

                code.push(`, sp${pointId})`);
            }
        } else {
            code.push(node);
        }
    }

    const parser = tolerantMode ? tolerantParser : strictParser;
    const code = [];
    const suggestPoints = [];
    let suggestSets = [];
    let body = [];
    let tree;

    if (debug) {
        console.log('\n== compile ======');
        console.log('source:', source);
    }

    tree = parser.parse(source);

    // if (debug) {
    //     console.log('tree:', JSON.stringify(tree, null, 4));
    // }

    astToCode(tree, []);

    if (suggestSets.length) {
        body.push(
            'const ' + suggestSets.join(', ') + ';',
            'const suggestPoint = (value, set) => set.add(value) && value;'
        );
    }

    body.push(
        // preserved variables
        'const $data = undefined, $context = undefined, $ctx = undefined, $array = undefined, $idx = undefined, $index = undefined;',
        'let current = data;',
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

module.exports = function createQuery(source, options) {
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

                    ranges.forEach(entry => {
                        entry.values = [...entry.values];
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

module.exports.buildin = buildin;
module.exports.methods = methods;
