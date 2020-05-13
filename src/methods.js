const buildin = require('./lang/compile-buildin');
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
    pick: buildin.pick,
    keys(current) {
        return Object.keys(current || {});
    },
    values(current) {
        const values = new Set();

        for (const key in current) {
            if (hasOwnProperty.call(current, key)) {
                addToSet(values, current[key]);
            }
        }

        return [...values];
    },
    entries(current) {
        const entries = [];

        for (const key in current) {
            if (hasOwnProperty.call(current, key)) {
                entries.push({ key, value: current[key] });
            }
        }

        return entries;
    },
    fromEntries(current) {
        const result = {};

        if (Array.isArray(current)) {
            current.forEach(entry => {
                if (entry) {
                    result[entry.key] = entry.value;
                }
            });
        }

        return result;
    },
    size(current) {
        if (isPlainObject(current)) {
            return Object.keys(current).length;
        }

        return (current && current.length) || 0;
    },
    sort(current, fn) {
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
    reverse(current) {
        if (!Array.isArray(current)) {
            return current;
        }

        return current.slice().reverse();
    },
    slice(current, from, to) {
        return buildin.slice(current, from, to);
    },
    group(current, keyGetter, valueGetter) {
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
    split(current, pattern) {
        return String(current).split(pattern);
    },
    join(current, separator) {
        return Array.isArray(current)
            ? current.join(separator)
            : String(current);
    },
    match(current, pattern, matchAll) {
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
    },
    reduce(current, fn, initValue = undefined) {
        if (Array.isArray(current)) {
            return initValue !== undefined
                ? current.reduce((res, current) => fn(current, res), initValue)
                : current.reduce((res, current) => fn(current, res));
        }

        return fn(current, initValue);
    }
});
