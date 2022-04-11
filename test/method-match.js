import assert from 'assert';
import query from 'jora';

describe('match()', () => {
    it('match string by string', () => {
        const input = '1,2,3';
        assert.deepEqual(
            query('match(",")')(input),
            {
                matched: [','],
                start: 1,
                end: 2,
                input,
                groups: null
            }
        );
    });

    it('match string by regexp', () => {
        const input = '1,2,3';
        assert.deepEqual(
            query('match(/,/)')(input),
            {
                matched: [','],
                start: 1,
                end: 2,
                input,
                groups: null
            }
        );
    });

    describe('matchAll', () => {
        const input = '1,2,3';
        const expected = [
            {
                matched: [','],
                start: 1,
                end: 2,
                input,
                groups: null
            },
            {
                matched: [','],
                start: 3,
                end: 4,
                input,
                groups: null
            }
        ];
        const tests = [
            'match(/,/, true)',
            'match(",", true)',
            'match(/,/g)',
            'match(/,/g, true)'
        ];

        for (const queryStr of tests) {
            it(queryStr, () =>
                assert.deepEqual(
                    query(queryStr)(input),
                    expected
                )
            );
        }
    });

    it('match non-string', () => {
        assert.deepEqual(
            query('match(/\\d+/)')(123.456),
            {
                matched: ['123'],
                start: 0,
                end: 3,
                input: '123.456',
                groups: null
            }
        );
    });

    it('match non-string with matchAll=true', () => {
        assert.deepEqual(
            query('match(/\\d+/, true)')(123.456),
            [
                {
                    matched: ['123'],
                    start: 0,
                    end: 3,
                    input: '123.456',
                    groups: null
                },
                {
                    matched: ['456'],
                    start: 4,
                    end: 7,
                    input: '123.456',
                    groups: null
                }
            ]
        );
    });

    it('grouping by match result', () => {
        const input = [
            { filename: 'foo/bar.js' },
            { filename: 'bar/bar.js' },
            { filename: 'foo/baz.js' }
        ];

        assert.deepEqual(
            query('group(=>filename.match(/^[^\\/]+/).matched.pick(0))')(input),
            [
                { key: 'foo', value: [input[0], input[2]] },
                { key: 'bar', value: [input[1]] }
            ]
        );
    });
});
