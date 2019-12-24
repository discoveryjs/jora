const assert = require('assert');
const query = require('./helpers/lib');
const values = [
    '/foo/',
    '/foo/i',
    '/fo\\/o/'
];

describe('lang/regexp', () => {
    values.forEach(value =>
        it(value, () =>
            assert.deepEqual(
                query(value)(),
                new Function('return ' + value)()
            )
        )
    );
});