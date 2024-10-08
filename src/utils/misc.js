export const hasOwn = Object.hasOwn || ((subject, key) => Object.hasOwnProperty.call(subject, key));
export const toString = Object.prototype.toString;

export function addToSet(set, value) {
    if (value !== undefined) {
        if (isArray(value)) {
            value.forEach(item => set.add(item));
        } else {
            set.add(value);
        }
    }

    return set;
}

export function addToMapSet(map, key, value) {
    if (map.has(key)) {
        map.get(key).add(value);
    } else {
        map.set(key, new Set([value]));
    }
}

export function getPropertyValue(value, property) {
    return value && hasOwn(value, property) ? value[property] : undefined;
}

export function isPlainObject(value) {
    return value !== null && typeof value === 'object' && value.constructor === Object;
}

export function isRegExp(value) {
    return toString.call(value) === '[object RegExp]';
}

export function isArrayLike(value) {
    return value && (isArray(value) || (hasOwn(value, 'length') && isFinite(value.length)));
}

export function isArray(value) {
    return Array.isArray(value) || ArrayBuffer.isView(value);
}

export function parseIntDefault(value, defaultValue = 0) {
    const int = parseInt(value, 10);
    return !isNaN(int) ? int : defaultValue;
}

export function isTruthy(value) {
    if (isArray(value)) {
        return value.length > 0;
    }

    if (isPlainObject(value)) {
        for (const key in value) {
            if (hasOwn(value, key)) {
                return true;
            }
        }

        return false;
    }

    return Boolean(value);
}
