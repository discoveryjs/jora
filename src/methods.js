import buildin from './lang/compile-buildin.js';
import { hasOwnProperty, addToSet, isPlainObject, isRegExp } from './utils/misc.js';

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

function getterToCmp(getter, cmp) {
    return getter.length === 1
        ? (a, b) => cmp(getter(a), getter(b))
        : getter;
}

function addToMap(map, key, value) {
    if (map.has(key)) {
        map.get(key).add(value);
    } else {
        map.set(key, new Set([value]));
    }
}

export default Object.freeze({
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
    sort(current, cmpOrMap = buildin.cmp) {
        let cmp;

        if (!Array.isArray(current)) {
            return current;
        }

        if (typeof cmpOrMap === 'function') {
            cmp = cmpOrMap.length === 2 ? cmpOrMap : (a, b) => {
                a = cmpOrMap(a);
                b = cmpOrMap(b);

                if (Array.isArray(a) && Array.isArray(b)) {
                    if (a.length !== b.length) {
                        return a.length < b.length ? -1 : 1;
                    }

                    for (let i = 0; i < a.length; i++) {
                        const ret = buildin.cmp(a[i], b[i]);

                        if (ret !== 0) {
                            return ret;
                        }
                    }

                    return 0;
                }

                return buildin.cmp(a, b);
            };
        } else {
            cmp = cmpOrMap;
        }

        return stableSort(current, cmp);
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
                    addToMap(map, key, valueGetter(item));
                }
            } else {
                addToMap(map, keys, valueGetter(item));
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

    // all Math static method with exclusion of 'max', 'min' and 'random'
    ...[
        'abs', 'acos', 'acosh', 'asin', 'asinh', 'atan', 'atan2', 'atanh',
        'cbrt', 'ceil', 'clz32', 'cos', 'cosh', 'exp', 'expm1', 'floor',
        'fround', 'hypot', 'imul', 'log', 'log10', 'log1p', 'log2', 'pow',
        'round', 'sign', 'sin', 'sinh', 'sqrt', 'tan', 'tanh', 'trunc'
    ].reduce((res, method) => {
        res[method] = Math[method];
        return res;
    }, {}),

    // statistics
    min(current, cmp = buildin.cmpNatural) {
        let min;

        if (current && isFinite(current.length) && typeof cmp === 'function') {
            cmp = getterToCmp(cmp, buildin.cmpNatural);

            for (let i = 0; i < current.length; i++) {
                const value = current[i];

                if ((min === undefined || cmp(value, min) < 0) && cmp(value, undefined) !== 0) {
                    min = value;
                }
            }
        }

        return min;
    },
    max(current, cmp = buildin.cmpNatural) {
        let max;

        if (current && isFinite(current.length) && typeof cmp === 'function') {
            cmp = getterToCmp(cmp, buildin.cmpNatural);

            for (let i = 0; i < current.length; i++) {
                const value = current[i];

                if ((max === undefined || cmp(value, max) >= 0) && cmp(value, undefined) !== 0) {
                    max = value;
                }
            }
        }

        return max;
    },
    sum
});

// statistics
function processNumericArray(current, map = self, fn) {
    if (isArrayLike(current)) {
        for (const value of current) {
            const mappedValue = map(value);

            if (mappedValue !== undefined) {
                fn(Number(mappedValue));
            }
        }
    }
}
function sum(current, fn) {
    let sum = undefined;
    let correction = 0;

    processNumericArray(current, fn, num => {
        if (sum === undefined) {
            sum = num;
        } else {
            // Kahan–Babuška summation with respect for Infinity
            // https://en.wikipedia.org/wiki/Kahan_summation_algorithm
            const transition = sum;
            const absTransition = Math.abs(transition);
            const absNum = Math.abs(num);

            sum += num;

            if (absTransition !== Infinity && absNum !== Infinity) {
                if (absTransition >= absNum) {
                    correction += (transition - sum) + num;
                } else {
                    correction += (num - sum) + transition;
                }
            }
        }
    });

    if (sum !== undefined) {
        sum += correction;
    }

    return sum;
}
