const buildin = require('./buildin');
const {
    addToSet,
    isPlainObject
} = require('./utils');

function noop() {}

function self(value) {
    return value;
}

function matchEntry(match) {
    return {
        matched: match.slice(),
        start: match.index,
        end: match.index + match[0].length,
        input: match.input,
        groups: match.groups || null
    };
}

module.exports = Object.freeze({
    bool: buildin.bool,
    filter: buildin.filter,
    map: buildin.map,
    keys: function(current) {
        return Object.keys(current || {});
    },
    values: function(current) {
        const values = new Set();

        for (const key in current) {
            if (hasOwnProperty.call(current, key)) {
                addToSet(values, current[key]);
            }
        }

        return [...values];
    },
    entries: function(current) {
        const entries = [];

        for (const key in current) {
            if (hasOwnProperty.call(current, key)) {
                entries.push({ key, value: current[key] });
            }
        }

        return entries;
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

        for (const key in current) {
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
        if (isPlainObject(current)) {
            return Object.keys(current).length;
        }

        return (current && current.length) || 0;
    },
    sort: function(current, fn) {
        let sorter;

        if (!Array.isArray(current)) {
            return current;
        }

        if (typeof fn === 'function') {
            sorter = fn.length === 2 ? fn : (a, b) => {
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
            };
        }

        return current.slice().sort(sorter);
    },
    reverse: function(current) {
        if (!Array.isArray(current)) {
            return current;
        }

        return current.slice().reverse();
    },
    slice: function(current, from, to) {
        return buildin.slice(current, from, to);
    },
    group: function(current, keyGetter, valueGetter) {
        if (typeof keyGetter !== 'function') {
            keyGetter = noop;
        }

        if (typeof valueGetter !== 'function') {
            valueGetter = self;
        }

        if (!Array.isArray(current)) {
            current = [current];
        }

        const map = new Map();
        const result = [];

        current.forEach(item => {
            let keys = keyGetter(item);

            if (!Array.isArray(keys)) {
                keys = [keys];
            }

            keys.forEach(key => {
                if (map.has(key)) {
                    map.get(key).add(valueGetter(item));
                } else {
                    map.set(key, new Set([valueGetter(item)]));
                }
            });
        });

        map.forEach((value, key) =>
            result.push({ key, value: [...value] })
        );

        return result;
    },
    split: function(current, pattern) {
        return String(current).split(pattern);
    },
    join: function(current, separator) {
        return Array.isArray(current)
            ? current.join(separator)
            : String(current);
    },
    match: function(current, pattern, matchAll) {
        const input = String(current);

        if (matchAll) {
            const result = [];
            let cursor = new RegExp(pattern, pattern.flags + 'g');
            let match;

            while (match = cursor.exec(input)) {
                result.push(matchEntry(match));
            }

            return result;
        }

        const match = String(current).match(pattern);
        return match && matchEntry(match);
    }
});
