import assert from 'assert';
import query from 'jora';

const values = [
    '/foo/',
    '/foo/i',
    '/foo/g',
    '/foo/m',
    '/foo/s',
    '/foo/u',
    '/foo/igmsu',
    '/fo\\/o/'
];
const badValues = [
    '/foo/d', // supported by JavaScript
    '/foo/y', // supported by JavaScript
    '/foo/x' // unknown flag
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

    badValues.forEach(value =>
        it(value, () =>
            assert.throws(
                () => query(value)(),
                /Parse error on line 1/
            )
        )
    );

    it('should error on flag duplication', () => {
        assert.throws(
            () => query('/test/gigm'),
            error => {
                assert.deepEqual(error.details, {
                    rawMessage: 'Duplicate flag in regexp',
                    text: undefined,
                    token: undefined,
                    expected: null,
                    loc: {
                        range: [8, 9],
                        start: {
                            column: 8,
                            line: 1,
                            offset: 8
                        },
                        end: {
                            column: 9,
                            line: 1,
                            offset: 9
                        }
                    }
                });

                return error.message === 'Duplicate flag in regexp\n\n/test/gigm\n--------^';
            }
        );
    });

    it('issue #2 - regexp shouldn\'t be hungry', () => {
        assert.deepEqual(
            query('/./ and "a/b"')(),
            'a/b'
        );
    });
});
