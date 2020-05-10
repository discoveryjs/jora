const assert = require('assert');
const query = require('./helpers/lib');
const values = [
    '0',
    '123',
    '123.456',
    '.456',
    '1e3',
    '1E3',
    '1.2e3',
    '.3e3',
    '1e+3',
    '1E+3',
    '1.5e+3',
    '.5e+3',
    '5e-1',
    '5E-1',
    '1.5e-2',
    '.5e-3',
    '-0',
    '-123',
    '-123.456',
    '-.456',
    '-1e3',
    '-1E3',
    '-1.2e3',
    '-.2e3',
    '-1e+3',
    '-1E+3',
    '-1.2e+3',
    '-.2e+3',
    '-5e-1',
    '-5E-1',
    '-1.5e-1',
    '-.5e-1'
];

describe('lang/number', () => {
    values.forEach(value =>
        it(value, () =>
            assert.strictEqual(
                query(value)(),
                Number(value)
            )
        )
    );
});
