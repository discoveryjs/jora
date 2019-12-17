const assert = require('assert');
const query = require('../src');
const values = [
    '"string"',
    '"str\\"ing"',
    '"\\u0020"',
    "'string'",
    "'str\\'ing'",
    "'\\u0020'"
];

describe('primitive: string', () => {
    values.forEach(value =>
        it(value, () =>
            assert.strictEqual(
                query(value)(),
                new Function('return ' + value)()
            )
        )
    );
});
