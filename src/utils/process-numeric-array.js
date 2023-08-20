import { isArrayLike } from './misc.js';

const self = value => value;

export function toNumber(value) {
    return value !== null && typeof value === 'object'
        ? NaN
        : Number(value);
}

export function processNumericArray(current, getter, apply) {
    if (isArrayLike(current)) {
        if (typeof getter !== 'function') {
            getter = self;
        }

        for (const value of current) {
            const mappedValue = getter(value);

            if (mappedValue !== undefined) {
                apply(toNumber(mappedValue));
            }
        }
    }
}
