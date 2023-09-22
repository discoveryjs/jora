import buildin from './lang/compile-buildin.js';
import { cmp } from './utils/compare.js';
import { numbers, count, sum, mean, variance, stdev, min, max, percentile, median } from './utils/statistics.js';
import { hasOwn, addToSet, addToMapSet, isPlainObject, isRegExp } from './utils/misc.js';

function noop() {}

function self(value) {
    return value;
}

function matchEntry(match) {
    if (match === null) {
        return null;
    }

    return {
        matched: match.slice(),
        start: match.index,
        end: match.index + match[0].length,
        input: match.input,
        groups: match.groups || null
    };
}

function replaceMatchEntry(args) {
    const last = args.pop();
    const groups = typeof last === 'string' ? null : last;
    const input = groups === null ? last : args.pop();
    const start = args.pop();

    return {
        matched: args,
        start,
        end: start + args[0].length,
        input,
        groups
    };
}

const replaceAll = String.prototype.replaceAll || function(pattern, replacement) {
    return isRegExp(pattern)
        ? this.replace(pattern, replacement)
        : this.split(pattern).join(String(replacement));
};

const stableSortSize = isSortStable(20) ? Infinity : isSortStable(10) ? 10 : 0;

function isSortStable(n) {
    return Array.from({ length: n }, (_, idx) => ({ idx }))
        .sort((a, b) => (a.idx % 2) - (b.idx % 2))
        .every((a, idx) =>
            idx < n / 2 ? (a.idx >> 1 === idx) : Math.ceil(n / 2) + (a.idx >> 1) === idx
        );
}

function stableSort(array, cmp) {
    // check size, e.g. old v8 had stable sort only for arrays with length less or equal 10
    if (array.length <= stableSortSize) {
        return array.slice().sort(cmp);
    }

    return array
        .map((value, idx) => ({ value, idx }))
        .sort((a, b) =>
            (a.value === undefined
                ? b.value !== undefined
                : b.value === undefined
                    ? -1
                    : cmp(a.value, b.value)) || (a.idx - b.idx)
        )
        .map(item => item.value);
}

export default Object.freeze({
    bool: buildin.bool,
    filter: buildin.filter,
    map: buildin.map,
    pick: buildin.pick,
    indexOf: buildin.indexOf,
    lastIndexOf: buildin.lastIndexOf,
    keys(current) {
        return Object.keys(current || {});
    },
    values(current) {
        const values = new Set();

        for (const key in current) {
            if (hasOwn(current, key)) {
                addToSet(values, current[key]);
            }
        }

        return [...values];
    },
    entries(current) {
        const entries = [];

        for (const key in current) {
            if (hasOwn(current, key)) {
                entries.push({ key, value: current[key] });
            }
        }

        return entries;
    },
    fromEntries(current) {
        const result = Object.create(null);

        if (Array.isArray(current)) {
            for (const entry of current) {
                if (entry) {
                    result[entry.key] = entry.value;
                }
            }
        }

        return result;
    },
    size(current) {
        if (isPlainObject(current)) {
            return Object.keys(current).length;
        }

        return (current && current.length) || 0;
    },
    sort(current, comparator = cmp) {
        if (!Array.isArray(current)) {
            return current;
        }

        if (typeof comparator === 'function' && comparator.length !== 2) {
            const getter = comparator;

            comparator = (a, b) => {
                a = getter(a);
                b = getter(b);

                if (Array.isArray(a) && Array.isArray(b)) {
                    if (a.length !== b.length) {
                        return a.length < b.length ? -1 : 1;
                    }

                    for (let i = 0; i < a.length; i++) {
                        const ret = cmp(a[i], b[i]);

                        if (ret !== 0) {
                            return ret;
                        }
                    }

                    return 0;
                }

                return cmp(a, b);
            };
        }

        return stableSort(current, comparator);
    },
    reverse(current) {
        return Array.isArray(current)
            ? current.slice().reverse()
            : current;
    },
    slice(current, from, to) {
        return buildin.slice(current, from, to);
    },
    group(current, keyGetter, valueGetter) {
        const map = new Map();
        const result = [];

        if (typeof keyGetter !== 'function') {
            keyGetter = noop;
        }

        if (typeof valueGetter !== 'function') {
            valueGetter = self;
        }

        if (!Array.isArray(current)) {
            current = [current];
        }

        for (const item of current) {
            const keys = keyGetter(item);

            if (Array.isArray(keys)) {
                for (const key of keys) {
                    addToMapSet(map, key, valueGetter(item));
                }
            } else {
                addToMapSet(map, keys, valueGetter(item));
            }
        }

        for (const [key, value] of map) {
            result.push({ key, value: [...value] });
        }

        return result;
    },
    join(current, separator) {
        return Array.isArray(current)
            ? current.join(separator)
            : String(current);
    },
    match(current, pattern, matchAll) {
        const input = String(current);
        const flags = isRegExp(pattern) ? pattern.flags : '';

        if (matchAll || flags.includes('g')) {
            const result = [];
            let cursor = new RegExp(pattern, (flags || '').replace(/g|$/, 'g'));
            let match;

            while (match = cursor.exec(input)) {
                result.push(matchEntry(match));
            }

            return result;
        }

        return matchEntry(input.match(pattern));
    },
    reduce(current, fn, initValue = undefined) {
        if (Array.isArray(current)) {
            return initValue !== undefined
                ? current.reduce((res, current) => fn(current, res), initValue)
                : current.reduce((res, current) => fn(current, res));
        }

        return fn(current, initValue);
    },

    // array/string
    split(current, pattern) {
        if (Array.isArray(current)) {
            const patternFn = typeof pattern === 'function' ? pattern : Object.is.bind(null, pattern);
            const result = [];
            let start = 0;
            let end = 0;

            for (; end < current.length; end++) {
                if (patternFn(current[end])) {
                    result.push(current.slice(start, end));
                    start = end + 1;
                }
            }

            result.push(current.slice(start, end));

            return result;
        }

        return String(current).split(pattern);
    },
    replace(current, pattern, replacement) {
        if (Array.isArray(current)) {
            const patternFn = typeof pattern === 'function' ? pattern : Object.is.bind(null, pattern);

            return current.map(
                typeof replacement === 'function'
                    ? current => patternFn(current) ? replacement(current) : current
                    : current => patternFn(current) ? replacement : current
            );
        }

        if (isRegExp(pattern) && !pattern.flags.includes('g')) {
            pattern = new RegExp(pattern, pattern.flags + 'g');
        }

        return replaceAll.call(
            String(current),
            pattern,
            typeof replacement === 'function'
                ? (...args) => replacement(replaceMatchEntry(args))
                : replacement
        );
    },

    // strings
    toLowerCase(current, locales) {
        return String(current).toLocaleLowerCase(locales);
    },
    toUpperCase(current, locales) {
        return String(current).toLocaleUpperCase(locales);
    },
    trim(current) {
        return String(current).trim();
    },

    // all Math static method with exclusion of 'max', 'min', 'log', `log1p` and 'random'
    ...[
        'abs', 'acos', 'acosh', 'asin', 'asinh', 'atan', 'atan2', 'atanh',
        'cbrt', 'ceil', 'clz32', 'cos', 'cosh', 'exp', 'expm1', 'floor',
        'fround', 'hypot', 'imul', 'log10', 'log2', 'pow',
        'round', 'sign', 'sin', 'sinh', 'sqrt', 'tan', 'tanh', 'trunc'
    ].reduce((res, method) => {
        res[method] = Math[method];
        return res;
    }, {}),
    ln: Math.log,
    ln1p: Math.log1p,

    // statistics
    numbers,
    count,
    sum,
    avg: mean,
    variance,
    stdev,
    min,
    max,
    percentile,
    p: percentile, // alias for percentile()
    median
});
