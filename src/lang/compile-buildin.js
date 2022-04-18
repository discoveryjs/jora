import { naturalCompare, naturalAnalyticalCompare } from '@discoveryjs/natural-compare';
import { hasOwnProperty, addToSet, getPropertyValue, isPlainObject, isRegExp, isArrayLike } from '../utils.js';

const TYPE_BOOLEAN = 1;
const TYPE_NAN = 2;
const TYPE_NUMBER = 3;
const TYPE_STRING = 4;
const TYPE_NULL = 5;
const TYPE_OBJECT = 6;
const TYPE_OTHER = 7;
const TYPE_UNDEFINED = 8;

function cmpType(value) {
    switch (typeof value) {
        case 'boolean':
            return TYPE_BOOLEAN;
        case 'number':
            return value !== value ? /* NaN */ TYPE_NAN : TYPE_NUMBER;
        case 'string':
            return TYPE_STRING;
        case 'object':
            return value === null ? TYPE_NULL : TYPE_OBJECT;
        case 'undefined':
            return TYPE_UNDEFINED;
        default:
            return TYPE_OTHER;
    }
}

export default Object.freeze({
    ensureArray,
    bool,
    and: (a, b) => bool(a) ? b : a,
    or: (a, b) => bool(a) ? a : b,
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
    map,
    mapRecursive,
    some,
    filter,
    slice
});

function ensureArray(value) {
    return Array.isArray(value) ? value : [value];
}

function bool(value) {
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
        return hasOwnProperty.call(b, a);
    }

    return b && typeof b.indexOf === 'function' ? b.indexOf(a) !== -1 : false;
}

function cmp(a, b) {
    const typeA = cmpType(a);
    const typeB = cmpType(b);

    return typeA !== typeB
        ? (typeA < typeB ? -1 : 1)
        : (a < b ? -1 : a > b ? 1 : 0);
}

function cmpAnalytical(a, b) {
    const typeA = cmpType(a);
    const typeB = cmpType(b);

    if (typeA !== typeB) {
        return typeA < typeB ? -1 : 1;
    }

    if (typeA === TYPE_NUMBER) {
        return b - a; // reverse order for numbers
    }

    return a < b ? -1 : a > b ? 1 : 0;
}

function cmpNatural(a, b) {
    const typeA = cmpType(a);
    const typeB = cmpType(b);

    if ((typeA === TYPE_NUMBER || typeA === TYPE_STRING) &&
        (typeB === TYPE_NUMBER || typeB === TYPE_STRING)) {
        return naturalCompare(a, b);
    }

    return typeA !== typeB
        ? (typeA < typeB ? -1 : 1)
        : (a < b ? -1 : a > b ? 1 : 0);
}

function cmpNaturalAnalytical(a, b) {
    const typeA = cmpType(a);
    const typeB = cmpType(b);

    if ((typeA === TYPE_NUMBER || typeA === TYPE_STRING) &&
        (typeB === TYPE_NUMBER || typeB === TYPE_STRING)) {
        return naturalAnalyticalCompare(a, b, true);
    }

    return typeA !== typeB
        ? (typeA < typeB ? -1 : 1)
        : (a < b ? -1 : a > b ? 1 : 0);
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
            if (hasOwnProperty.call(current, key)) {
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

    return hasOwnProperty.call(current, ref) ? current[ref] : undefined;
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
        ? value.some(current => bool(fn(current)))
        : bool(fn(value));
}

function filter(value, fn) {
    if (Array.isArray(value)) {
        return value.filter(current => bool(fn(current)));
    }

    return bool(fn(value)) ? value : undefined;
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
