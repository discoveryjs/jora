import { cmp, cmpAnalytical, cmpNatural, cmpNaturalAnalytical } from '../utils/compare.js';
import { hasOwn, addToSet, getPropertyValue, isPlainObject, isRegExp, isArrayLike, isTruthy, parseIntDefault, isArray } from '../utils/misc.js';

export default Object.freeze({
    ensureArray,
    bool: isTruthy,
    and: (a, b) => isTruthy(a) ? b : a,
    or: (a, b) => isTruthy(a) ? a : b,
    add,
    sub,
    mul,
    div,
    mod,
    eq,
    ne,
    lt,
    lte,
    gt,
    gte,
    in: in_,
    notIn: (a, b) => !in_(a, b),
    has: (a, b) => in_(b, a),
    hasNo: (a, b) => !in_(b, a),
    cmp,
    cmpAnalytical,
    cmpNatural,
    cmpNaturalAnalytical,
    match,
    pick,
    indexOf,
    lastIndexOf,
    map,
    mapRecursive,
    some,
    filter,
    slice
});

function ensureArray(value) {
    return isArray(value) ? value : [value];
}

function add(a, b) {
    if (isArray(a) || isArray(b)) {
        return [...new Set([
            ...isArray(a) ? a : [a],
            ...isArray(b) ? b : [b]
        ])];
    }

    return a + b;
}

function sub(a, b) {
    if (isArray(a)) {
        const result = new Set(a);

        // filter b items from a
        if (isArray(b)) {
            b.forEach(item => result.delete(item));
        } else {
            result.delete(b);
        }

        return [...result];
    }

    return a - b;
}

function mul(a, b) {
    return a * b;
}

function div(a, b) {
    return a / b;
}

function mod(a, b) {
    return a % b;
}

function eq(a, b) {
    return Object.is(a, b);
}

function ne(a, b) {
    return !Object.is(a, b);
}

function lt(a, b) {
    return a < b;
}

function lte(a, b) {
    return a <= b;
}

function gt(a, b) {
    return a > b;
}

function gte(a, b) {
    return a >= b;
}

function in_(a, b) {
    if (isPlainObject(b)) {
        return hasOwn(b, a);
    }

    return b
        ? internalIndexOf(b, a) !== -1
        : false;
}

function match(value, pattern) {
    if (typeof pattern === 'function') {
        return some(value, pattern);
    }

    if (isRegExp(pattern)) {
        return some(value, pattern.test.bind(pattern));
    }

    if (pattern === null || pattern === undefined) {
        return true;
    }

    return false;
}

function pick(current, ref = () => true) {
    if (!current) {
        return undefined;
    }

    if (typeof ref === 'function') {
        if (isArray(current) || typeof current === 'string') {
            for (let i = 0; i < current.length; i++) {
                if (isTruthy(ref(current[i], i))) {
                    return current[i];
                }
            }
        }

        for (const key in current) {
            if (hasOwn(current, key)) {
                if (isTruthy(ref(current[key], key))) {
                    return current[key];
                }
            }
        }

        return undefined;
    }

    if (isArray(current) || typeof current === 'string') {
        return isFinite(ref)
            ? current[ref < 0 ? current.length + Number(ref) : Number(ref) || 0]
            : undefined;
    }

    return hasOwn(current, ref) ? current[ref] : undefined;
}

function indexOf(dict, searchElement, fromIndex) {
    return dict
        ? internalIndexOf(dict, searchElement, fromIndex)
        : -1;
}

function internalIndexOf(dict, searchElement, fromIndex = 0) {
    // Allow searching for NaN values in arrays unlike JavaScript
    // JavaScript: NaN values are never compared as equal, so indexOf() always returns -1 when `searchElement` is NaN.
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf#description
    if (Number.isNaN(searchElement)) {
        if (isArrayLike(dict)) {
            // Used a loop instead of findIndex() since it doesn't support for fromIndex
            for (let i = parseIntDefault(fromIndex, 0); i < dict.length; i++) {
                if (Number.isNaN(dict[i])) {
                    return i;
                }
            }
        }
    }

    if (typeof dict.indexOf === 'function') {
        return dict.indexOf(searchElement, fromIndex);
    }

    return -1;
}

function lastIndexOf(dict, searchElement, fromIndex) {
    return dict
        ? internalLastIndexOf(dict, searchElement, fromIndex)
        : -1;
}

function internalLastIndexOf(dict, searchElement, fromIndex) {
    // Allow searching for NaN values in arrays unlike JavaScript
    // JavaScript: NaN values are never compared as equal, so indexOf() always returns -1 when `searchElement` is NaN.
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/lastIndexOf#description
    if (Number.isNaN(searchElement)) {
        if (isArrayLike(dict)) {
            // Used a loop instead of findLastIndex() since it doesn't support for fromIndex
            for (let i = parseIntDefault(fromIndex, dict.length - 1); i >= 0; i--) {
                if (Number.isNaN(dict[i])) {
                    return i;
                }
            }
        }
    }

    if (typeof dict.lastIndexOf === 'function') {
        // Use `dict.length - 1` as the default because `undefined` is treated as 0
        return dict.lastIndexOf(searchElement, parseIntDefault(fromIndex, dict.length - 1));
    }

    return -1;
}

function map(value, getter) {
    const fn = typeof getter === 'function'
        ? getter
        : current => getPropertyValue(current, getter);

    if (isArray(value)) {
        return [
            ...value.reduce(
                (set, item) => addToSet(set, fn(item)),
                new Set()
            )
        ];
    }

    return value !== undefined ? fn(value) : value;
}

function mapRecursive(value, getter) {
    const result = new Set();

    addToSet(result, map(value, getter));

    result.forEach(current =>
        addToSet(result, map(current, getter))
    );

    return [...result];
}

function some(value, fn) {
    return isArray(value)
        ? value.some(current => isTruthy(fn(current)))
        : isTruthy(fn(value));
}

function filter(value, fn) {
    if (isArray(value)) {
        return value.filter(current => isTruthy(fn(current)));
    }

    return isTruthy(fn(value)) ? value : undefined;
}

function slice(value, from, to, step = 1) {
    if (!isArrayLike(value)) {
        return [];
    }

    from = parseIntDefault(from, 0);
    to = parseIntDefault(to, value.length);
    step = parseIntDefault(step, 1) || 1;

    // Convert negative values to offsets from the end of the array and clamp offsets by the array length
    from = from < 0
        ? Math.max(0, value.length + from)
        : Math.min(value.length, from);
    to = to < 0
        ? Math.max(0, value.length + to)
        : Math.min(value.length, to);

    if (from >= 0 && to >= 0 && from <= to && step === 1) {
        return typeof value === 'string'
            ? value.slice(from, to)
            : Array.prototype.slice.call(value, from, to);
    }

    // Invert `from`, `to`, and `step` if `from` is greater than `to`
    // 2..5 step 1  -> 2 3 4 5
    // 2..5 step -1 -> 5 4 3 2
    // 5..2 step 1  == 2..5 step -1
    // 5..2 step -1 == 2..5 step 1
    if (from > to) {
        [from, to] = [to, from];
        step = -step;
    }

    const result = [];

    if (step > 0) {
        for (let i = from; i < to; i += step) {
            result.push(value[i]);
        }
    } else {
        for (let i = to - 1; i >= from; i += step) {
            result.push(value[i]);
        }
    }

    return typeof value === 'string'
        ? result.join('')
        : result;
}
