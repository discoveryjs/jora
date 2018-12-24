const buildin = require('./buildin');
const methods = require('./methods');
const {
    strict: strictParser,
    tollerant: tollerantParser
} = require('./parser');
const { addToSet, isPlainObject} = require('./utils');

const cacheRegular = new Map();
const cacheSuggest = new Map();
const contextToType = {
    '': 'property',
    'path': 'property',
    'value': 'value',
    'in-value': 'value'
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
                addToSet(suggestions, JSON.stringify(value));
                break;
            case 'number':
                addToSet(suggestions, String(value));
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
    }

    return [...suggestions];
}

function compileFunction(source, suggestMode, debug) {
    const parser = suggestMode ? tollerantParser : strictParser;
    const code = [];
    const suggestPoints = [];
    let suggestSets = [];
    let body = [];
    let tree;

    if (debug) {
        console.log('\n== compile ======');
        console.log('source:', source);
    }

    if (suggestMode) {
        // FIXME: add a comment due to parser missed to add a placeholder when no input left,
        // should be fixed in the parser
        source += '//';
    }

    tree = parser.parse(source);

    // if (debug) {
    //     console.log('tree:', JSON.stringify(tree, null, 4));
    // }

    tree.forEach(function toCode(node) {
        if (Array.isArray(node)) {
            node.forEach(toCode);
        } else if (suggestMode && node.startsWith('/*')) {
            if (node === '/*s*/') {
                code.push('suggestPoint(');
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
                        (from === to && isWhiteSpace(source, to))) {
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
    });

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

    if (suggestMode) {
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
    const suggestMode = Boolean(options.suggest);
    const localMethods = options.methods ? Object.assign({}, methods, options.methods) : methods;
    const cache = suggestMode ? cacheSuggest : cacheRegular;
    let fn;

    source = suggestMode ? String(source) : String(source).trim();

    if (cache.has(source)) {
        fn = cache.get(source);
    } else {
        fn = compileFunction(source, suggestMode, debug);
        cache.set(source, fn);
    }

    if (debug) {
        console.log('fn', fn.toString());
    }

    if (suggestMode) {
        return function query(data, context, suggestPos = -1) {
            const points = fn(buildin, localMethods, data, context, query);
            const suggestions = [];

            if (suggestPos === -1) {
                return points.map(([values, from, to, context]) => ({
                    context: context || 'path',
                    list: valuesToSuggestions(context, values),
                    from,
                    to
                }));
            }

            for (let i = 0; i < points.length; i++) {
                let [values, from, to, context] = points[i];

                if (suggestPos >= from && suggestPos <= to) {
                    let current = source.substring(from, to);

                    if (!/\S/.test(current)) {
                        current = '';
                        from = to = suggestPos;
                    }

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
                }
            }

            return suggestions.length ? suggestions : null;
        };
    }

    return function query(data, context) {
        return fn(buildin, localMethods, data, context, query);
    };
};

module.exports.buildin = buildin;
module.exports.methods = methods;
