import assert from 'assert';
import query from 'jora';

describe('lang/assertions', () => {
    it('single assertion', () => {
        assert.strictEqual(query('is number')(123), true);
        assert.strictEqual(query('is number')('123'), false);
    });

    it('single assertion with negation', () => {
        assert.strictEqual(query('is not number')(123), false);
        assert.strictEqual(query('is not number')('123'), true);
    });

    it('single assertion with parentheses', () => {
        assert.strictEqual(query('is (number)')(123), true);
        assert.strictEqual(query('is (number)')('123'), false);
    });

    it('single assertion with parentheses and negation', () => {
        assert.strictEqual(query('is not (number)')(123), false);
        assert.strictEqual(query('is not (number)')('123'), true);
    });

    it('single assertion with parentheses and double negation', () => {
        assert.strictEqual(query('is not (not number)')(123), true);
        assert.strictEqual(query('is not (not number)')('123'), false);
    });

    describe('built-in assertions', () => {
        const untested = new Set(Object.keys(query.assertions));
        const testcases = {
            primitive: [
                { value: 0, expected: true },
                { value: 1, expected: true },
                { value: false, expected: true },
                { value: true, expected: true },
                { value: '', expected: true },
                { value: 'abc', expected: true },
                { value: null, expected: true },
                { value: undefined, expected: true },
                { value: Symbol(), expected: true },
                { value: () => {}, expected: false },
                { value: {}, expected: false },
                { value: [], expected: false }
            ],
            function: [
                { value: () => {}, expected: true },
                { value: 'abc', expected: false },
                { value: 0, expected: false }
            ],
            symbol: [
                { value: Symbol(), expected: true },
                { value: 'Symbol()', expected: false }
            ],
            string: [
                { value: '', expected: true },
                { value: 'abc', expected: true },
                { value: 0, expected: false }
            ],
            number: [
                { value: 0, expected: true },
                { value: 1, expected: true },
                { value: '1', expected: false }
            ],
            int: [
                { value: 0, expected: true },
                { value: 1, expected: true },
                { value: 1.5, expected: false },
                { value: '1', expected: false }
            ],
            finite: [
                { value: 1, expected: true },
                { value: 1.5, expected: true },
                { value: '1', expected: false },
                { value: NaN, expected: false },
                { value: Infinity, expected: false }
            ],
            nan: [
                { value: 1, expected: false },
                { value: 1.5, expected: false },
                { value: '1', expected: false },
                { value: NaN, expected: true },
                { value: [1,2,3], expected: false },
                { value: { foo: 1 }, expected: false }
            ],
            infinity: [
                { value: Infinity, expected: true },
                { value: -Infinity, expected: true },
                { value: 1, expected: false },
                { value: NaN, expected: false }
            ],
            boolean: [
                { value: true, expected: true },
                { value: false, expected: true },
                { value: 1, expected: false },
                { value: 'true', expected: false }
            ],
            null: [
                { value: null, expected: true },
                { value: undefined, expected: false },
                { value: 0, expected: false }
            ],
            undefined: [
                { value: null, expected: false },
                { value: undefined, expected: true },
                { value: 0, expected: false }
            ],
            nullish: [
                { value: null, expected: true },
                { value: undefined, expected: true },
                { value: 0, expected: false }
            ],
            object: [
                { value: {}, expected: true },
                { value: { foo: 1 }, expected: true },
                { value: [], expected: false },
                { value: [1, 2, 3], expected: false },
                { value: null, expected: false },
                { value: () => {}, expected: false },
                { value: /rx/, expected: false }
            ],
            array: [
                { value: {}, expected: false },
                { value: { foo: 1 }, expected: false },
                { value: [], expected: true },
                { value: [1, 2, 3], expected: true },
                { value: null, expected: false }
            ],
            regexp: [
                { value: /tx/, expected: true },
                { value: {}, expected: false }
            ],
            truthy: [
                { value: 0, expected: false },
                { value: 1, expected: true },
                { value: false, expected: false },
                { value: true, expected: true },
                { value: '', expected: false },
                { value: 'abc', expected: true },
                { value: [], expected: false },
                { value: [1], expected: true },
                { value: {}, expected: false },
                { value: { foo: 1 }, expected: true }
            ],
            falsy: [
                { value: 0, expected: true },
                { value: 1, expected: false },
                { value: false, expected: true },
                { value: true, expected: false },
                { value: '', expected: true },
                { value: 'abc', expected: false },
                { value: [], expected: true },
                { value: [1], expected: false },
                { value: {}, expected: true },
                { value: { foo: 1 }, expected: false }
            ]
        };

        for (const [assertion, tests] of Object.entries(testcases)) {
            untested.delete(assertion);
            describe(assertion, () => {
                for (const testcase of tests) {
                    it(JSON.stringify(testcase.value) || String(testcase.value), () => {
                        assert.strictEqual(
                            query(`is ${assertion}`)(testcase.value),
                            testcase.expected
                        );
                    });
                }
            });
        }

        it('all assertions are tested', () => {
            assert(untested.size === 0, `Untested assertions: ${[...untested].join(', ')}`);
        });
    });

    describe('complex expressions', () => {
        const testcases = [
            // or
            { query: '123 is (number or string)', expected: true },
            { query: '"123" is (number or string)', expected: true },
            { query: 'true is (number or string)', expected: false },
            { query: 'true is not (number or string)', expected: true },

            // or + not
            { query: '123 is (number or not string)', expected: true },
            { query: 'true is (number or not string)', expected: true },
            { query: '"123" is (number or not string)', expected: false },

            // and
            { query: '$empty: => size() = 0; [] is (array and $empty)', expected: true },
            { query: '$empty: => size() = 0; [1] is (array and $empty)', expected: false },
            { query: '$empty: => size() = 0; 1 is (array and $empty)', expected: false },

            // and + not
            { query: '123 is (number and not string)', expected: true },
            { query: '"123" is (number and not string)', expected: false },
            { query: '123 is (number and not nan)', expected: true },
            { query: 'NaN is (number and not nan)', expected: false },
            { query: 'NaN is (number and nan)', expected: true },

            // mixed
            { query: '123 is (number and (not nan or not infinity))', expected: true },
            { query: 'NaN is (number and (not nan or not infinity))', expected: true },
            { query: '123 is (number and (nan or infinity))', expected: false },
            { query: 'NaN is (number and (nan or infinity))', expected: true }
        ];

        for (const testcase of testcases) {
            it(testcase.query, () => {
                assert.strictEqual(query(testcase.query)(), testcase.expected);
            });
        }
    });
});
