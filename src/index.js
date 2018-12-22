const {
    strict: strictParser,
    tollerant: tollerantParser
} = require('./parser');

const hasOwnProperty = Object.prototype.hasOwnProperty;
const cacheRegular = Object.create(null);
const cacheSuggest = Object.create(null);

const TYPE_ARRAY = 1;
const TYPE_OBJECT = 2;
const TYPE_SCALAR = 3;

function noop() {}

function self(value) {
    return value;
}

function getPropertyValue(value, property) {
    return value && hasOwnProperty.call(value, property) ? value[property] : undefined;
}

function isPlainObject(value) {
    return value && typeof value === 'object' && value.constructor === Object;
}

function addToSet(value, set) {
    if (value !== undefined) {
        if (Array.isArray(value)) {
            value.forEach(item => set.add(item));
        } else {
            set.add(value);
        }
    }
}

var buildin = Object.freeze({
    type: function(value) {
        if (Array.isArray(value)) {
            return TYPE_ARRAY;
        }

        if (isPlainObject(value)) {
            return TYPE_OBJECT;
        }

        return TYPE_SCALAR;
    },
    bool: function(data) {
        switch (this.type(data)) {
            case TYPE_ARRAY:
                return data.length > 0;

            case TYPE_OBJECT:
                for (let key in data) {
                    if (hasOwnProperty.call(data, key)) {
                        return true;
                    }
                }
                return false;

            default:
                return Boolean(data);
        }
    },
    add: function(a, b) {
        const typeA = this.type(a);
        const typeB = this.type(b);

        if (typeA !== TYPE_ARRAY) {
            if (typeB === TYPE_ARRAY) {
                [a, b] = [b, a];
            }
        }

        switch (this.type(a)) {
            case TYPE_ARRAY:
                return [...new Set([].concat(a, b))];

            case TYPE_OBJECT:
                return Object.assign({}, a, b);

            default:
                return a + b;
        }
    },
    sub: function(a, b) {
        switch (this.type(a)) {
            case TYPE_ARRAY:
                const result = new Set(a);

                // filter b items from a
                if (Array.isArray(b)) {
                    b.forEach(item => result.delete(item));
                } else {
                    result.delete(b);
                }

                return [...result];

            case TYPE_OBJECT:
                // not sure what we need do here:
                // - just filter keys from `a`
                // - or filter key+value pairs?
                // - take in account type of b? (array, Object.keys(b), scalar as a key)

            default:
                return a - b;
        }
    },
    mul: function(a, b) {
        return a * b;
    },
    div: function(a, b) {
        return a / b;
    },
    mod: function(a, b) {
        return a % b;
    },
    eq: function(a, b) {
        return a === b;
    },
    ne: function(a, b) {
        return a !== b;
    },
    lt: function(a, b) {
        return a < b;
    },
    lte: function(a, b) {
        return a <= b;
    },
    gt: function(a, b) {
        return a > b;
    },
    gte: function(a, b) {
        return a >= b;
    },
    in: function(a, b) {
        switch (this.type(b)) {
            case TYPE_OBJECT:
                return hasOwnProperty.call(b, a);

            default:
                return b && typeof b.indexOf === 'function' ? b.indexOf(a) !== -1 : false;
        }
    },
    regexp: function(data, rx) {
        switch (this.type(data)) {
            case TYPE_ARRAY:
                return this.filter(data, current => rx.test(current));

            default:
                return rx.test(data);
        }
    },
    get: function(data, getter) {
        const fn = typeof getter === 'function'
            ? getter
            : current => getPropertyValue(current, getter);

        switch (this.type(data)) {
            case TYPE_ARRAY:
                const result = new Set();

                for (let i = 0; i < data.length; i++) {
                    addToSet(fn(data[i]), result);
                }

                return [...result];

            default:
                return data !== undefined ? fn(data) : data;
        }
    },
    recursive: function(data, getter) {
        const result = new Set();

        addToSet(this.get(data, getter), result);

        result.forEach(current =>
            addToSet(this.get(current, getter), result)
        );

        return [...result];
    },
    filter: function(data, query) {
        switch (this.type(data)) {
            case TYPE_ARRAY:
                return data.filter(current =>
                    this.bool(query(current))
                );

            default:
                return this.bool(query(data)) ? data : undefined;
        }
    },
    suggest: function(data, idx, suggests) {
        let list = suggests.has(idx);

        if (!suggests.has(idx)) {
            list = new Set();
            suggests.set(idx, list);
        } else {
            list = suggests.get(idx);
        }

        if (Array.isArray(data)) {
            data.forEach(item => {
                if (isPlainObject(item)) {
                    addToSet(Object.keys(item), list);
                }
            });
        } else if (isPlainObject(data)) {
            addToSet(Object.keys(data), list);
        }

        return data;
    }
});

var methods = Object.freeze({
    bool: function(current) {
        return buildin.bool(current);
    },
    keys: function(current) {
        return Object.keys(current || {});
    },
    values: function(current) {
        const values = new Set();

        Object
            .values(current || {})
            .forEach(value => addToSet(value, values));

        return [...values];
    },
    entries: function(current) {
        if (!current) {
            return [];
        }

        return Object
            .keys(current)
            .map(key => ({ key, value: current[key] }));
    },
    pick: function(current, ref) {
        if (!current) {
            return undefined;
        }

        if (typeof ref === 'function') {
            if (Array.isArray(current)) {
                return current.find(item => ref(item));
            }

            for (const key in current) {
                if (hasOwnProperty.call(current, key)) {
                    if (ref(current[key])) {
                        return { key, value: current[key] };
                    }
                }
            }

            return;
        }

        return Array.isArray(current) ? current[ref || 0] : current[ref];
    },
    mapToArray: function(current, keyProperty = 'key', valueProperty) {
        const result = [];

        for (let key in current) {
            if (hasOwnProperty.call(current, key)) {
                result.push(
                    valueProperty
                        ? { [keyProperty]: key, [valueProperty]: current[key] }
                        : Object.assign({ [keyProperty]: key }, current[key])
                );
            }
        }

        return result;
    },
    size: function(current) {
        switch (buildin.type(current)) {
            case TYPE_ARRAY:
                return current.length;

            case TYPE_OBJECT:
                return Object.keys(current).length;

            default:
                return (current && current.length) || 0;
        }
    },
    sort: function(current, fn) {
        if (buildin.type(current) !== TYPE_ARRAY) {
            return current;
        }

        if (typeof fn === 'function') {
            return current.slice().sort((a, b) => {
                a = fn(a);
                b = fn(b);

                if (Array.isArray(a) && Array.isArray(b)) {
                    if (a.length !== b.length) {
                        return a.length < b.length ? -1 : 1;
                    }

                    for (let i = 0; i < a.length; i++) {
                        if (a[i] < b[i]) {
                            return -1;
                        } else if (a[i] > b[i]) {
                            return 1;
                        }
                    }

                    return 0;
                }

                return a < b ? -1 : a > b;
            });
        }

        return current.slice().sort();
    },
    reverse: function(current) {
        if (buildin.type(current) !== TYPE_ARRAY) {
            return current;
        }

        return current.slice().reverse();
    },
    group: function(current, keyGetter, valueGetter) {
        if (typeof keyGetter !== 'function') {
            keyGetter = noop;
        }

        if (typeof valueGetter !== 'function') {
            valueGetter = self;
        }

        if (buildin.type(current) !== TYPE_ARRAY) {
            current = [current];
        }

        const map = new Map();
        const result = [];

        current.forEach(item => {
            const key = keyGetter(item);

            if (map.has(key)) {
                map.get(key).add(valueGetter(item));
            } else {
                map.set(key, new Set([valueGetter(item)]));
            }
        });

        map.forEach((value, key) =>
            result.push({ key, value: [...value] })
        );

        return result;
    },
    filter: function(current, fn) {
        return buildin.filter(current, fn);
    },
    map: function(current, fn) {
        return buildin.get(current, fn);
    }
});

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

    if (source in cache) {
        fn = cache[source];
    } else {
        fn = compileFunction(source, suggestMode, debug);
        cache[source] = fn;
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
