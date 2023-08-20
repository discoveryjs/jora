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
            { query: '123 is (number and not NaN)', expected: true },
            { query: 'NaN is (number and not NaN)', expected: false },
            { query: 'NaN is (number and NaN)', expected: true },

            // mixed
            { query: '123 is (number and (not NaN or not Infinity))', expected: true },
            { query: 'NaN is (number and (not NaN or not Infinity))', expected: true },
            { query: '123 is (number and (NaN or Infinity))', expected: false },
            { query: 'NaN is (number and (NaN or Infinity))', expected: true }
        ];

        for (const testcase of testcases) {
            it(testcase.query, () => {
                assert.strictEqual(query(testcase.query)(), testcase.expected);
            });
        }
    });
});
