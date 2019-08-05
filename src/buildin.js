const {
    addToSet,
    getPropertyValue,
    isPlainObject,
    isRegExp
} = require('./utils');

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
    and: function(a, b) {
        return this.bool(a) ? b : a;
    },
    or: function(a, b) {
        return this.bool(a) ? a : b;
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
    match: function(value, tester) {
        if (typeof tester === 'function') {
            return this.filter(value, tester);
        }

        if (isRegExp(tester)) {
            return this.filter(value, tester.test.bind(tester));
        }

        if (tester === null || tester === undefined) {
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
    slice: function(value, from, to, step) {
        if (!Array.isArray(value) && typeof value !== 'string') {
            return value;
        }

        if (step && step !== 1) {
            const result = [];
            const reverse = step < 0;

            step *= Math.sign(step);

            if (from < 0) {
                from = value.length + from;
            }

            if (to < 0) {
                to = value.length + to;
            }

            for (let i = from; i < to; i += step) {
                result.push(value[i]);
            }

            if (reverse) {
                result.reverse();
            }

            return result;
        }

        return value.slice(from, to);
    },
    recursive: function(value, getter) {
        const result = new Set();

        addToSet(result, this.map(value, getter));

        result.forEach(current =>
            addToSet(result, this.map(current, getter))
        );

        return [...result];
    },
    filter: function(value, fn) {
        if (Array.isArray(value)) {
            return value.filter(current => this.bool(fn(current)));
        }

        return this.bool(fn(value)) ? value : undefined;
    }
});
