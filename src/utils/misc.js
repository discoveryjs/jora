export const hasOwnProperty = Object.hasOwnProperty;
export const toString = Object.prototype.toString;

export function addToSet(set, value) {
    if (value !== undefined) {
        if (Array.isArray(value)) {
            value.forEach(item => set.add(item));
        } else {
            set.add(value);
        }
    }

    return set;
}

export function getPropertyValue(value, property) {
    return value && hasOwnProperty.call(value, property) ? value[property] : undefined;
}

export function isPlainObject(value) {
    return value !== null && typeof value === 'object' && value.constructor === Object;
}

export function isRegExp(value) {
    return toString.call(value) === '[object RegExp]';
}

export function isArrayLike(value) {
    return value && hasOwnProperty.call(value, 'length');
}
