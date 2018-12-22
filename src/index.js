const buildin = require('./buildin');
const methods = require('./methods');
const {
    strict: strictParser,
    tollerant: tollerantParser
} = require('./parser');

const cacheRegular = new Map();
const cacheSuggest = new Map();

function isWhiteSpace(str, offset) {
    const code = str.charCodeAt(offset);
    return code === 9 || code === 10 || code === 13 || code === 32;
}

function compileFunction(source, suggestMode, debug) {
    const parser = suggestMode ? tollerantParser : strictParser;
    const code = [];
    let body;
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
                code.push('fn.suggest(');
            } else {
                const items = node.substring(2, node.length - 2).split(',');
                const ranges = [];

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

                    ranges.push(from, to, context);
                }

                code.push(`, "${ranges}", suggests)`);
            }
        } else {
            code.push(node);
        }
    });

    body = [
        'const $data = undefined, $context = undefined, $ctx = undefined, $array = undefined, $idx = undefined, $index = undefined;', // preserved variables
        'let current = data;',
        code.join('')
    ];

    if (suggestMode) {
        body.unshift('const suggests = new Map();');
        body.push(body.pop().replace(/^return\s+/, ''));
        body.push('return suggests');
    } else {
        body.unshift('const suggests = undefined;');
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
            const suggestions = fn(buildin, localMethods, data, context, query);

            if (suggestPos === -1) {
                return suggestions;
            }

            const points = [...suggestions.keys()];

            for (let i = 0; i < points.length; i++) {
                const range = points[i];
                let items = range.split(',');

                for (let j = 0; j < items.length; j += 3) {
                    let from = Number(items[j]);
                    let to = Number(items[j + 1]);
                    let context = items[j + 2];

                    if (suggestPos >= from && suggestPos <= to) {
                        let current = source.substring(from, to);

                        if (!/\S/.test(current)) {
                            current = '';
                            from = to = suggestPos;
                        }

                        // console.log({current, variants:[...suggestions.get(range)], suggestions })
                        return {
                            context: context || 'path',
                            current,
                            list: [...suggestions.get(range)]
                                .map(name => `property:${name}`), // .concat(Object.keys(localMethods).map(name => `method:${name}()`)),
                            from,
                            to
                        };
                    }
                }
            }

            return null;
        };
    }

    return function query(data, context) {
        return fn(buildin, localMethods, data, context, query);
    };
};

module.exports.buildin = buildin;
module.exports.methods = methods;
