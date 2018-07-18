const parser = require('./parser');
const hasOwnProperty = Object.prototype.hasOwnProperty;
const cache = Object.create(null);

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
    toArray: function(value) {
        return Array.isArray(value)
            ? value
            : this.bool(value)
                ? [value]
                : [];
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
                // - just filter keys from a
                // - or filter key+value pairs?
                // - take in account type of b? (array, Object.keys(b), scalar as a key)

            default:
                return a - b;
        }
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
        if (this.type(b) !== TYPE_ARRAY) {
            return false;
        }

        switch (this.type(a)) {
            // case TYPE_ARRAY:
            //     break;

            default:
                return b.indexOf(a) !== -1;
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
                return [];
        }
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
    size: function(current) {
        return (current && current.length) || 0;
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
    group: function(current, keyFetcher, valueFetcher) {
        if (typeof keyFetcher !== 'function') {
            keyFetcher = noop;
        }

        if (typeof valueFetcher !== 'function') {
            valueFetcher = self;
        }

        if (buildin.type(current) !== TYPE_ARRAY) {
            current = [current];
        }

        const map = new Map();
        const result = [];

        current.forEach(item => {
            const key = keyFetcher(item);

            if (map.has(key)) {
                map.get(key).add(valueFetcher(item));
            } else {
                map.set(key, new Set([valueFetcher(item)]));
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

function compileFunction(query, debug) {
    var tree = parser.parse(query);
    var js = [];

    if (debug) {
        console.log('\n==== compile ===');
        console.log('query:', query);
        console.log('tree:', tree);
    }

    tree.forEach(function toJs(node) {
        if (Array.isArray(node)) {
            node.forEach(toJs);
        } else {
            js.push(node);
        }
    });

    if (debug) {
        console.log('js', js.join(''));
    }

    return cache[query] = new Function('fn', 'method', 'data', 'subject', 'self', 'var current = data;\nreturn ' + js.join(''));
}

module.exports = function createQuery(query, extraFunctions, debug) {
    var localMethods = extraFunctions ? Object.assign({}, methods, extraFunctions) : methods;
    var func = cache[query.trim()] || compileFunction(query.trim(), debug);

    if (debug) {
        console.log('fn', func.toString());
    }

    return function query(data, subject) {
        return func(buildin, localMethods, data, subject, query);
    };
};

module.exports.buildin = buildin;
module.exports.methods = methods;
