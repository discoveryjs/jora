const assert = require('assert');
const query = require('./helpers/lib');
const values = [
    '"string"',
    '"str\\"ing"',
    '"\\u0020"',
    "'string'",
    "'str\\'ing'",
    "'\\u0020'"
];

describe('lang/string', () => {
    values.forEach(value =>
        it(value, () =>
            assert.strictEqual(
                query(value)(),
                new Function('return ' + value)()
            )
        )
    );
});
