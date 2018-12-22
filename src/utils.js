function addToSet(value, set) {
    if (value !== undefined) {
        if (Array.isArray(value)) {
            value.forEach(item => set.add(item));
        } else {
            set.add(value);
        }
    }
}

function getPropertyValue(value, property) {
    return value && hasOwnProperty.call(value, property) ? value[property] : undefined;
}

function isPlainObject(value) {
    return value && typeof value === 'object' && value.constructor === Object;
}

module.exports = {
    addToSet,
    getPropertyValue,
    isPlainObject
};
