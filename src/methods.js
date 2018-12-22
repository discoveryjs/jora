const buildin = require('./buildin');
const {
    TYPE_ARRAY,
    TYPE_OBJECT,
    addToSet,
    getType
} = require('./utils');

function noop() {}

function self(value) {
    return value;
}

module.exports = Object.freeze({
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
        switch (getType(current)) {
            case TYPE_ARRAY:
                return current.length;

            case TYPE_OBJECT:
                return Object.keys(current).length;

            default:
                return (current && current.length) || 0;
        }
    },
    sort: function(current, fn) {
        if (getType(current) !== TYPE_ARRAY) {
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
        if (getType(current) !== TYPE_ARRAY) {
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

        if (getType(current) !== TYPE_ARRAY) {
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
