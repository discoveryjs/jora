import { isPlainObject, isRegExp, isTruthy } from './utils/misc.js';

export default Object.freeze({
    number: value => typeof value === 'number',
    int: Number.isInteger,
    finite: value => isFinite(Number(value)),
    NaN: value => isNaN(value),
    Infinity: value => value === Infinity || value === -Infinity,
    string: value => typeof value === 'string',
    boolean: value => value === true || value === false,
    null: value => value === null,
    undefined: value => value === undefined,
    nullish: value => value === null || value === undefined,
    object: isPlainObject,
    array: Array.isArray,
    regexp: isRegExp,
    truthy: isTruthy,
    falsy: value => !isTruthy(value)
});
