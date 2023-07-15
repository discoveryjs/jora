import { isArrayLike } from './misc.js';

const self = value => value;

export function toNumber(value) {
    return value !== null && typeof value === 'object'
        ? NaN
        : Number(value);
}
export function processNumericArray(current, getter, formula, apply) {
    if (isArrayLike(current)) {
        if (typeof getter !== 'function') {
            getter = self;
        }

        if (typeof formula !== 'function') {
            formula = self;
        }

        for (const value of current) {
            const mappedValue = getter(value);

            if (mappedValue !== undefined) {
                apply(toNumber(formula(toNumber(mappedValue))));
            }
        }
    }
}
export function sumAndCount(current, getter, formula) {
    let sum = undefined;
    let count = 0;
    let correction = 0;

    processNumericArray(current, getter, formula, num => {
        count++;

        if (sum === undefined) {
            sum = num;
        } else {
            // Kahan–Babuška summation with respect for Infinity
            // https://en.wikipedia.org/wiki/Kahan_summation_algorithm
            const transition = sum;
            const absTransition = Math.abs(transition);
            const absNum = Math.abs(num);

            sum += num;

            if (absTransition !== Infinity && absNum !== Infinity) {
                if (absTransition >= absNum) {
                    correction += (transition - sum) + num;
                } else {
                    correction += (num - sum) + transition;
                }
            }
        }
    });

    if (sum !== undefined) {
        sum += correction;
    }

    return { sum, count };
}
