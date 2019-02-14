const assert = require('assert');
const query = require('../src');
const values = [
    '0',
    '123',
    '123.456'
    // '1e3',
    // '5e-1'
];

describe('primitive: number', () => {
    values.forEach(value =>
        it(value, () =>
            assert.strictEqual(
                query(value)(),
                new Function('return ' + value)()
            )
        )
    );
});
