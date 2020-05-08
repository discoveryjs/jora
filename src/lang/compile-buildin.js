const {
    addToSet,
    getPropertyValue,
    isPlainObject,
    isRegExp,
    isArrayLike
} = require('../utils');

module.exports = Object.freeze({
    bool: function(value) {
        if (Array.isArray(value)) {
            return value.length > 0;
        }

        if (isPlainObject(value)) {
            for (const key in value) {
                if (hasOwnProperty.call(value, key)) {
                    return true;
                }
            }

            return false;
        }

        return Boolean(value);
    },
    add: function(a, b) {
        if (Array.isArray(a) || Array.isArray(b)) {
            return [...new Set([].concat(a, b))];
        }

        return a + b;
    },
    sub: function(a, b) {
        if (Array.isArray(a)) {
            const result = new Set(a);

            // filter b items from a
            if (Array.isArray(b)) {
                b.forEach(item => result.delete(item));
            } else {
                result.delete(b);
            }

            return [...result];
        }

        return a - b;
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
        if (isPlainObject(b)) {
            return hasOwnProperty.call(b, a);
        }

        return b && typeof b.indexOf === 'function' ? b.indexOf(a) !== -1 : false;
    },
    cmp: function(a, b) {
        return a > b ? 1 : a < b ? -1 : 0;
    },
    match: function(value, pattern) {
        if (typeof pattern === 'function') {
            return this.some(value, pattern);
        }

        if (isRegExp(pattern)) {
            return this.some(value, pattern.test.bind(pattern));
        }

        if (pattern === null || pattern === undefined) {
            return true;
        }

        return false;
    },
    map: function(value, getter) {
        const fn = typeof getter === 'function'
            ? getter
            : current => getPropertyValue(current, getter);

        if (Array.isArray(value)) {
            return [
                ...value.reduce(
                    (set, item) => addToSet(set, fn(item)),
                    new Set()
                )
            ];
        }

        return value !== undefined ? fn(value) : value;
    },
    mapRecursive: function(value, getter) {
        const result = new Set();

        addToSet(result, this.map(value, getter));

        result.forEach(current =>
            addToSet(result, this.map(current, getter))
        );

        return [...result];
    },
    some(value, fn) {
        return Array.isArray(value)
            ? value.some(current => this.bool(fn(current)))
            : this.bool(fn(value));
    },
    filter: function(value, fn) {
        if (Array.isArray(value)) {
            return value.filter(current => this.bool(fn(current)));
        }

        return this.bool(fn(value)) ? value : undefined;
    },
    slice: function(value, from = 0, to = value && value.length, step = 1) {
        if (!isArrayLike(value)) {
            return [];
        }

        from = parseInt(from, 10) || 0;
        to = parseInt(to, 10) || value.length;
        step = parseInt(step, 10) || 1;

        if (step !== 1) {
            const result = [];

            from = from < 0
                ? Math.max(0, value.length + from)
                : Math.min(value.length, from);
            to = to < 0
                ? Math.max(0, value.length + to)
                : Math.min(value.length, to);

            for (let i = step > 0 ? from : to - 1; i >= from && i < to; i += step) {
                result.push(value[i]);
            }

            return result;
        }

        if (typeof value === 'string') {
            return value.slice(from, to);
        }

        return Array.prototype.slice.call(value, from, to);
    }
});
