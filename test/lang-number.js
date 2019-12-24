const assert = require('assert');
const query = require('./helpers/lib');
const values = [
    '0',
    '123',
    '123.456',
    '1e3',
    '1E3',
    '1e+3',
    '1E+3',
    '5e-1',
    '5E-1',
    '-0',
    '-123',
    '-123.456',
    '-1e3',
    '-1E3',
    '-1e+3',
    '-1E+3',
    '-5e-1',
    '-5E-1'
];

describe('lang/number', () => {
    values.forEach(value =>
        it(value, () =>
            assert.strictEqual(
                query(value)(),
                new Function('return ' + value)()
            )
        )
    );
});
