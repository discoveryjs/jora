const { version } = require('../package.json');
const buildin = require('./buildin');
const methods = require('./methods');
const {
    strict: strictParser,
    tolerant: tolerantParser
} = require('./parse');
const stringify = require('./stringify');
const compile = require('./compile');
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

function defaultDebugHandler(sectionName, value) {
    console.log(`[${sectionName}]`);
    if (typeof value === 'string') {
        console.log(value);
    } else if (value !== undefined) {
        console.dir(value, { depth: null });
    }
    console.log();
}

function compileFunction(source, statMode, tolerantMode, debug) {
    if (debug) {
        debug('=========================');
        debug('Compile query from source', source);
    }

    const parser = tolerantMode ? tolerantParser : strictParser;
    const parseResult = parser.parse(source);

    if (debug) {
        const esc = s => JSON.stringify(s).slice(1, -1);
        debug('AST', parseResult.ast);
        debug('Restored source', stringify(parseResult.ast));
        debug('Suggest ranges', parseResult.suggestRanges.sort((a, b) => a[0] - b[0]).map(r => {
            const pre = esc(source.slice(0, r[0])).length;
            const long = esc(source.substring(r[0], r[1])).length;
            return (
                esc(source) + '\n' +
                (' '.repeat(pre) + (!long ? '\\' : '~'.repeat(long)) + ' ' + r[0] + ':' + r[1] + ' [' + r[2] + '] from ' + r[3])
            );
        }).join('\n'));
    }

    const fn = statMode
        ? compile(parseResult.ast, parseResult.suggestRanges, statMode)
        : compile(parseResult.ast);

    if (debug) {
        debug('Function', fn.toString());
    }

    return fn;
}

function createQuery(source, options) {
    options = options || {};

    const debug = typeof options.debug === 'function' ? options.debug : Boolean(options.debug) ? defaultDebugHandler : false;
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

    if (statMode) {
        return function(data, context) {
            const points = fn(buildin, localMethods, data, context);

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
    methods,
    syntax: {
        parse(source, tolerantMode) {
            const parser = tolerantMode ? tolerantParser : strictParser;
            return parser.parse(source);
        },
        compile,
        stringify
    }
});
