const assert = require('assert');
const query = require('./helpers/lib');
const entries = [
    ['-1', [-1]],
    ['0', [0]],
    ['1', [1]],
    ['undefined', [undefined]],
    ['null', [null]],
    ['false', [false]],
    ['true', [true]],
    ['""', ['']],
    ['"test"', ['test']],
    ['{}', [{}]]
];

describe('lang/array', () => {
    describe('declaration', () => {
        entries.concat([
            ['', []],
            ['[]', [[]]],
            ['1', [1]],
            ['1, 2', [1, 2]],
            ['1, 2, 3', [1, 2, 3]]
        ]).forEach(([test, expected]) => {
            test = `[${test}]`;
            it(test, () =>
                assert.deepEqual(
                    query(test)(['$']),
                    expected
                )
            );
        });
    });

    describe('spread literals', () => {
        entries.concat([
            ['', ['$']],
            ['[]', []],
            ['[1]', [1]],
            ['[1, 2]', [1, 2]],
            ['[1, 2, 3]', [1, 2, 3]]
        ]).forEach(([test, expected]) => {
            test = `[...${test}]`;
            it(test, () =>
                assert.deepEqual(
                    query(test)(['$']),
                    expected
                )
            );
        });
    });

    describe('spread vars', () => {
        entries.concat([
            ['$', ['$']],
            ['[]', []],
            ['[1]', [1]],
            ['[1, 2]', [1, 2]],
            ['[1, 2, 3]', [1, 2, 3]]
        ]).forEach(([test, expected]) => {
            test = `$test:${test}; [...$test]`;
            it(test, () =>
                assert.deepEqual(
                    query(test)(['$']),
                    expected
                )
            );
        });
    });

    describe('should allow a single trailing comma', () => {
        const valid = [
            ['[1,]', [1]],
            ['[1 ,]', [1]],
            ['[1, 2, ]', [1, 2]]
        ];
        const invalid = [
            '[,]',
            '[ , ]',
            '[ , 1]',
            '[ 1,,]',
            '[1,,2]',
            '[1,2,,]'
        ];

        for (const [test, expected] of valid) {
            it(test, () =>
                assert.deepStrictEqual(
                    query(test)(),
                    expected
                )
            );
        }

        for (const test of invalid) {
            it(test, () =>
                assert.throws(
                    () => query(test),
                    /Parse error/
                )
            );
        }
    });
});
