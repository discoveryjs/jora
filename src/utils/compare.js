import { naturalCompare, naturalAnalyticalCompare } from '@discoveryjs/natural-compare';

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

export function cmp(a, b) {
    const typeA = cmpType(a);
    const typeB = cmpType(b);

    return typeA !== typeB
        ? (typeA < typeB ? -1 : 1)
        : (a < b ? -1 : a > b ? 1 : 0);
}

export function cmpAnalytical(a, b) {
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

export function cmpNatural(a, b) {
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

export function cmpNaturalAnalytical(a, b) {
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

export function getterToCmp(getter, cmp) {
    return getter.length === 1
        ? (a, b) => cmp(getter(a), getter(b))
        : getter;
}
