import { cmp, cmpAnalytical, cmpNatural, cmpNaturalAnalytical } from '../utils/compare.js';
import { hasOwn, addToSet, getPropertyValue, isPlainObject, isRegExp, isArrayLike, isTruthy } from '../utils/misc.js';

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
    return Array.isArray(value) ? value : [value];
}

function add(a, b) {
    if (Array.isArray(a) || Array.isArray(b)) {
        return [...new Set([].concat(a, b))];
    }

    return a + b;
}

function sub(a, b) {
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
        if (Array.isArray(current) || typeof current === 'string') {
            for (let i = 0; i < current.length; i++) {
                if (ref(current[i], i)) {
                    return current[i];
                }
            }
        }

        for (const key in current) {
            if (hasOwn(current, key)) {
                if (ref(current[key], key)) {
                    return current[key];
                }
            }
        }

        return undefined;
    }

    if (Array.isArray(current) || typeof current === 'string') {
        return isFinite(ref)
            ? current[ref < 0 ? current.length + Number(ref) : Number(ref) || 0]
            : undefined;
    }

    return hasOwn(current, ref) ? current[ref] : undefined;
}

function indexOf(dict, value, fromIndex) {
    return dict
        ? internalIndexOf(dict, value, fromIndex)
        : -1;
}

function internalIndexOf(dict, value, fromIndex = 0) {
    if (Number.isNaN(value)) {
        if (isArrayLike(dict)) {
            for (let i = parseInt(fromIndex, 10) || 0; i < dict.length; i++) {
                if (Number.isNaN(dict[i])) {
                    return i;
                }
            }
        }
    }

    if (typeof dict.indexOf === 'function') {
        return dict.indexOf(value, fromIndex);
    }

    return -1;
}

function lastIndexOf(dict, value, fromIndex) {
    return dict
        ? internalLastIndexOf(dict, value, fromIndex)
        : -1;
}

function internalLastIndexOf(dict, value, fromIndex) {
    if (Number.isNaN(value)) {
        if (isArrayLike(dict)) {
            for (let i = parseInt(fromIndex, 10) || dict.length - 1; i >= 0; i--) {
                if (Number.isNaN(dict[i])) {
                    return i;
                }
            }
        }
    }

    if (typeof dict.lastIndexOf === 'function') {
        return dict.lastIndexOf(value, parseInt(fromIndex, 10) || dict.length - 1);
    }

    return -1;
}

function map(value, getter) {
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
    return Array.isArray(value)
        ? value.some(current => isTruthy(fn(current)))
        : isTruthy(fn(value));
}

function filter(value, fn) {
    if (Array.isArray(value)) {
        return value.filter(current => isTruthy(fn(current)));
    }

    return isTruthy(fn(value)) ? value : undefined;
}

function slice(value, from = 0, to = value && value.length, step = 1) {
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
