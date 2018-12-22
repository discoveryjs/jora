const TYPE_ARRAY = 1;
const TYPE_OBJECT = 2;
const TYPE_SCALAR = 3;

function addToSet(value, set) {
    if (value !== undefined) {
        if (Array.isArray(value)) {
            value.forEach(item => set.add(item));
        } else {
            set.add(value);
        }
    }
}

function getType(value) {
    if (Array.isArray(value)) {
        return TYPE_ARRAY;
    }

    if (isPlainObject(value)) {
        return TYPE_OBJECT;
    }

    return TYPE_SCALAR;
}

function getPropertyValue(value, property) {
    return value && hasOwnProperty.call(value, property) ? value[property] : undefined;
}

function isPlainObject(value) {
    return value && typeof value === 'object' && value.constructor === Object;
}

module.exports = {
    TYPE_ARRAY,
    TYPE_OBJECT,
    TYPE_SCALAR,

    addToSet,
    getType,
    getPropertyValue,
    isPlainObject
};
