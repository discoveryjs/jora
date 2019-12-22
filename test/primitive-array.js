const assert = require('assert');
const query = require('./helpers/lib');
const values = [
    '[]',
    '[1]',
    '[1, 2]',
    '[1, 1, 1]',
    '[0]',
    '[{}]',
    '[[]]'
];

describe('primitive: array', () => {
    values.forEach(value =>
        it(value, () =>
            assert.deepEqual(
                query(value)(),
                new Function('return ' + value)()
            )
        )
    );
});
