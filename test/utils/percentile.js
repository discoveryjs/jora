import assert from 'assert';
import { percentile, median, numbersPercentile, numbersMedian } from '../../src/utils/percentile.js';

describe('utils/percentile', () => {
    for (const fn of [percentile, numbersPercentile]) {
        describe(`${fn.name}() basics`, () => {
            it('should return undefined for k below zero', () => {
                assert.strictEqual(fn([1, 2, 3], -1), undefined);
            });

            it('should return undefined for k above zero', () => {
                assert.strictEqual(fn([1, 2, 3], 101), undefined);
            });

            it('should return undefined for k not a number', () => {
                assert.strictEqual(fn([1, 2, 3], NaN), undefined);
            });

            it('should return undefined for an empty array', () => {
                assert.strictEqual(fn([], 50), undefined);
            });

            it('should return value for a single element array', () => {
                assert.strictEqual(fn([42], 0), 42);
                assert.strictEqual(fn([42], 50), 42);
                assert.strictEqual(fn([42], 100), 42);
            });

            it('should return value for a two elements array', () => {
                assert.strictEqual(fn([0, 10], 0), 0);
                assert.strictEqual(fn([0, 10], 25), 2.5);
                assert.strictEqual(fn([0, 10], 50), 5);
                assert.strictEqual(fn([0, 10], 75), 7.5);
                assert.strictEqual(fn([0, 10], 100), 10);
            });

            it('should return value for a 3 elements array', () => {
                assert.strictEqual(fn([1, 2, 3], 0), 1);
                assert.strictEqual(fn([3, 2, 1], 25), 1.5);
                assert.strictEqual(fn([2, 1, 3], 50), 2);
                assert.strictEqual(fn([3, 1, 2], 75), 2.5);
                assert.strictEqual(fn([1, 2, 3], 100), 3);
            });

            it('should return NaN when an array contains NaN', () => {
                assert.strictEqual(fn([NaN, 2, 3], 0), NaN);
                assert.strictEqual(fn([1, NaN, 3], 0), NaN);
                assert.strictEqual(fn([1, 2, NaN], 0), NaN);
            });

            for (let p = 0; p <= 100; p += .5) {
                it(`p(${p}) for an array of 11 elements`, () => {
                    const values = [1, 9, 4, 3, 2, 5, 6, 7, 8, 0, 10];
                    const preservedValues = values.slice();
                    const actual = fn(values, p);
                    const expected = p / 10;

                    assert.strictEqual(actual, expected);
                    assert.deepStrictEqual(values, preservedValues);
                });
            }
        });
    }

    for (const fn of [median, numbersMedian]) {
        describe(`${fn.name}() basics`, () => {
            const cases = [
                {
                    title: 'should find the median in an odd-length array',
                    values: [5, 3, 8, 2, 10],
                    expected: 5
                },
                {
                    title: 'should find the median in an even-length array',
                    values: [5, 3, 8, 2, 10, 7],
                    expected: 6
                },
                {
                    title: 'should find the median in an even-length array #2',
                    values: [5, 3, 8, 2, 10, 7, 1, 9, 4, 11],
                    expected: 6
                },
                {
                    title: 'should return undefined for an empty array',
                    values: [],
                    expected: undefined
                },
                {
                    title: 'should find the median in an array with negative values',
                    values: [5, -3, 8, -2, 10],
                    expected: 5
                },
                {
                    title: 'should find the median in an array with duplicate values',
                    values: [5, 3, 8, 5, 3],
                    expected: 5
                }
            ];

            for (const { title, values, expected } of cases) {
                it(title, () => {
                    const preserveValues = values.slice();
                    const actual = fn(values);

                    assert.strictEqual(actual, expected);
                    assert.deepStrictEqual(values, preserveValues, 'should not mutate input values');
                });
            }
        });
    }
});
