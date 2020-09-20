const {
    addToSet,
    getPropertyValue,
    isPlainObject,
    isRegExp,
    isArrayLike
} = require('../utils');
const { naturalCompare, naturalAnalyticalCompare } = require('./natural-compare');
const TYPE_BOOLEAN = 1;
const TYPE_NAN = 2;
const TYPE_NUMBER = 3;
const TYPE_STRING = 4;
const TYPE_NULL = 5;
const TYPE_OBJECT = 6;
const TYPE_OTHER = 7;

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
        default:
            return TYPE_OTHER;
    }
}

module.exports = Object.freeze({
    ensureArray(value) {
        return Array.isArray(value) ? value : [value];
    },
    bool(value) {
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
    add(a, b) {
        if (Array.isArray(a) || Array.isArray(b)) {
            return [...new Set([].concat(a, b))];
        }

        return a + b;
    },
    sub(a, b) {
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
    mul(a, b) {
        return a * b;
    },
    div(a, b) {
        return a / b;
    },
    mod(a, b) {
        return a % b;
    },
    eq(a, b) {
        return Object.is(a, b);
    },
    ne(a, b) {
        return !Object.is(a, b);
    },
    lt(a, b) {
        return a < b;
    },
    lte(a, b) {
        return a <= b;
    },
    gt(a, b) {
        return a > b;
    },
    gte(a, b) {
        return a >= b;
    },
    in(a, b) {
        if (isPlainObject(b)) {
            return hasOwnProperty.call(b, a);
        }

        return b && typeof b.indexOf === 'function' ? b.indexOf(a) !== -1 : false;
    },
    cmp(a, b) {
        const typeA = cmpType(a);
        const typeB = cmpType(b);

        return typeA !== typeB
            ? (typeA < typeB ? -1 : 1)
            : (a < b ? -1 : a > b ? 1 : 0);
    },
    cmpAnalytical(a, b) {
        const typeA = cmpType(a);
        const typeB = cmpType(b);

        if (typeA !== typeB) {
            return typeA < typeB ? -1 : 1;
        }

        if (typeA === TYPE_NUMBER) {
            return b - a; // reverse order for numbers
        }

        return a < b ? -1 : a > b ? 1 : 0;
    },
    cmpNatural(a, b) {
        const typeA = cmpType(a);
        const typeB = cmpType(b);

        if ((typeA === TYPE_NUMBER || typeA === TYPE_STRING) &&
            (typeB === TYPE_NUMBER || typeB === TYPE_STRING)) {
            return naturalCompare(a, b);
        }

        return typeA !== typeB
            ? (typeA < typeB ? -1 : 1)
            : (a < b ? -1 : a > b ? 1 : 0);
    },
    cmpNaturalAnalytical(a, b) {
        const typeA = cmpType(a);
        const typeB = cmpType(b);

        if ((typeA === TYPE_NUMBER || typeA === TYPE_STRING) &&
            (typeB === TYPE_NUMBER || typeB === TYPE_STRING)) {
            return naturalAnalyticalCompare(a, b, true);
        }

        return typeA !== typeB
            ? (typeA < typeB ? -1 : 1)
            : (a < b ? -1 : a > b ? 1 : 0);
    },
    match(value, pattern) {
        if (typeof pattern === 'function') {
            return this.some(value, pattern);
        }

        if (isRegExp(pattern)) {
            return this.some(value, pattern.test.bind(pattern));
        }

        if (pattern === null || pattern === undefined) {
            return true;
        }

        return false;
    },
    pick(current, ref = () => true) {
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
    },
    map(value, getter) {
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
    mapRecursive(value, getter) {
        const result = new Set();

        addToSet(result, this.map(value, getter));

        result.forEach(current =>
            addToSet(result, this.map(current, getter))
        );

        return [...result];
    },
    some(value, fn) {
        return Array.isArray(value)
            ? value.some(current => this.bool(fn(current)))
            : this.bool(fn(value));
    },
    filter(value, fn) {
        if (Array.isArray(value)) {
            return value.filter(current => this.bool(fn(current)));
        }

        return this.bool(fn(value)) ? value : undefined;
    },
    slice(value, from = 0, to = value && value.length, step = 1) {
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
});
