import { isPlainObject, isRegExp, isTruthy } from './utils/misc.js';

export default Object.freeze({
    function: value => typeof value === 'function',
    symbol: value => typeof value === 'symbol',
    primitive: value => value === null || (typeof value !== 'object' && typeof value !== 'function'),
    string: value => typeof value === 'string',
    number: value => typeof value === 'number',
    int: Number.isInteger,
    finite: value => Number.isFinite(value),
    nan: value => Number.isNaN(value),
    infinity: value => value === Infinity || value === -Infinity,
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
