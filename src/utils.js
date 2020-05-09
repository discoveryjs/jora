const hasOwnProperty = Object.hasOwnProperty;
const toString = Object.prototype.toString;

function addToSet(set, value) {
    if (value !== undefined) {
        if (Array.isArray(value)) {
            value.forEach(item => set.add(item));
        } else {
            set.add(value);
        }
    }

    return set;
}

function getPropertyValue(value, property) {
    return value && hasOwnProperty.call(value, property) ? value[property] : undefined;
}

function isPlainObject(value) {
    return value !== null && typeof value === 'object' && value.constructor === Object;
}

function isRegExp(value) {
    return toString.call(value) === '[object RegExp]';
}

function isArrayLike(value) {
    return value && hasOwnProperty.call(value, 'length');
}

module.exports = {
    addToSet,
    getPropertyValue,
    isPlainObject,
    isRegExp,
    isArrayLike
};
