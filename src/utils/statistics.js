import { cmpNatural, getterToCmp } from './compare.js';
import { percentile as percentileMethod } from './percentile.js';
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
    let correction = 0;
    let count = 0;

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

export function numbers(current, getter, formula) {
    // if (current && hasOwn(current, STAT_MARKER)) {
    //     return current.input;
    // }

    const result = [];

    processNumericArray(current, getter, formula, result.push.bind(result));

    return result;
}

export function count(current, getter) {
    let count = 0;

    if (isArrayLike(current)) {
        if (typeof getter !== 'function') {
            getter = self;
        }

        for (const value of current) {
            if (getter(value) !== undefined) {
                count++;
            }
        }
    }

    return count;
}

export function sum(current, getter, formula) {
    return sumAndCount(current, getter, formula).sum;
}

export function numbersSum(numbers) {
    if (numbers.length === 0) {
        return;
    }

    let sum = numbers[0];
    let correction = 0;

    for (let i = 1; i < numbers.length; i++) {
        const num = numbers[i];

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

    return sum + correction;
}

export function mean(current, getter, formula) {
    const { sum, count } = sumAndCount(current, getter, formula);

    if (count > 0) {
        return sum / count;
    }
}

export function variance(current, getter, formula) {
    let count = 0;
    let mean = 0;
    let M2 = 0;

    // Welford's online algorithm
    // https://en.wikipedia.org/wiki/Algorithms_for_calculating_variance#Welford%27s_online_algorithm
    processNumericArray(current, getter, formula, num => {
        count += 1;
        let delta = num - mean;
        mean += delta / count;
        M2 += delta * (num - mean);
    });

    if (count > 0) {
        return M2 / count;
    }
}

export function stdev(current, getter, formula) {
    const v = variance(current, getter, formula);

    if (v !== undefined) {
        return Math.sqrt(v);
    }
}

export function min(current, cmp = cmpNatural) {
    let min;

    if (current && isFinite(current.length) && typeof cmp === 'function') {
        cmp = getterToCmp(cmp, cmpNatural);

        for (let i = 0; i < current.length; i++) {
            const value = current[i];

            if ((min === undefined || cmp(value, min) < 0) && cmp(value, undefined) !== 0) {
                min = value;
            }
        }
    }

    return min;
}

export function max(current, cmp = cmpNatural) {
    let max;

    if (current && isFinite(current.length) && typeof cmp === 'function') {
        cmp = getterToCmp(cmp, cmpNatural);

        for (let i = 0; i < current.length; i++) {
            const value = current[i];

            if ((max === undefined || cmp(value, max) >= 0) && cmp(value, undefined) !== 0) {
                max = value;
            }
        }
    }

    return max;
}

export function percentile(current, p, getter, formula) {
    // if (current && hasOwn(current, STAT_MARKER)) {
    //     return numbersPercentile(current.input, p, getter, formula);
    // }
    if (isArrayLike(current)) {
        return percentileMethod(current, p, getter, formula);
    }
}

export function median(current, getter, formula) {
    return percentile(current, 50, getter, formula);
}
