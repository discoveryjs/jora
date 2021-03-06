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

    it('issue #2 - regexp shouldn\'t be hungry', () => {
        assert.deepEqual(
            query('/./ and "a/b"')(),
            'a/b'
        );
    });
});
