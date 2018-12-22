const {
    TYPE_ARRAY,
    TYPE_OBJECT,
    addToSet,
    getType,
    getPropertyValue,
    isPlainObject
} = require('./utils');

module.exports = Object.freeze({
    bool: function(data) {
        switch (getType(data)) {
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
        const typeA = getType(a);
        const typeB = getType(b);

        if (typeA !== TYPE_ARRAY) {
            if (typeB === TYPE_ARRAY) {
                [a, b] = [b, a];
            }
        }

        switch (getType(a)) {
            case TYPE_ARRAY:
                return [...new Set([].concat(a, b))];

            case TYPE_OBJECT:
                return Object.assign({}, a, b);

            default:
                return a + b;
        }
    },
    sub: function(a, b) {
        switch (getType(a)) {
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
        switch (getType(b)) {
            case TYPE_OBJECT:
                return hasOwnProperty.call(b, a);

            default:
                return b && typeof b.indexOf === 'function' ? b.indexOf(a) !== -1 : false;
        }
    },
    regexp: function(data, rx) {
        switch (getType(data)) {
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

        switch (getType(data)) {
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
        switch (getType(data)) {
            case TYPE_ARRAY:
                return data.filter(current =>
                    this.bool(query(current))
                );

            default:
                return this.bool(query(data)) ? data : undefined;
        }
    },
    suggest: function(data, idx, suggests) {
        let list;

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
