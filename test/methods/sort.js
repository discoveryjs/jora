import assert from 'assert';
import query from 'jora';
import data from '../helpers/fixture.js';

const escapeNaN = array => array.map(x => x !== x ? 'NaN' : x);

describe('sort()', () => {
    it('basic', () => {
        assert.deepEqual(
            query('deps.filename.sort()')(data),
            [...new Set(
                data
                    .reduce((res, item) => res.concat(item.deps), [])
                    .map(item => item.filename)
            )].sort()
        );
    });

    it('should be applicable for non-array values (have no effect)', () => {
        assert.deepEqual(
            query('sort()')(data[0]),
            data[0]
        );
    });

    it('should work with TypedArray', () => {
        assert.deepEqual(
            query('sort()')(new Uint8Array([3, 2, 1, 4])),
            new Uint8Array([1, 2, 3, 4])
        );
    });

    it('custom sorter', () => {
        assert.deepEqual(
            query('sort(=>refs.size()).filename')(data),
            data
                .slice()
                .sort((a, b) => a.refs.length - b.refs.length)
                .map(item => item.filename)
        );
    });

    it('should sort by several values', () => {
        assert.deepEqual(
            query('sort(=>[dependants.size(), deps.size()]).({filename, deps: deps.size(), dependants: dependants.size()})')(data),
            data
                .slice()
                .sort((a, b) => ((a.dependants.length - b.dependants.length) || (a.deps.length - b.deps.length)))
                .map(item => ({
                    filename: item.filename,
                    deps: item.deps.length,
                    dependants: item.dependants.length
                }))
        );
    });

    it('should sort by arrays with different length', () => {
        assert.deepEqual(
            query('sort(=>field)')([
                { field: ['a', 'b', 'c'] },
                { field: ['x'] },
                { field: ['b', 'c'] },
                { field: ['a', 'c'] },
                { field: ['a'] }
            ]),
            [
                { field: ['a'] },
                { field: ['x'] },
                { field: ['a', 'c'] },
                { field: ['b', 'c'] },
                { field: ['a', 'b', 'c'] }
            ]
        );
    });

    it('should not mutate original data', () => {
        const data = [3, 2, 1];
        const actual = query('sort()')(data);

        assert.deepEqual(
            data,
            [3, 2, 1]
        );
        assert.notStrictEqual(
            actual,
            data
        );
        assert.deepEqual(
            actual,
            [1, 2, 3]
        );
    });

    it('should use a two argument function as comparator', () => {
        const context = {
            sorting: (a, b) => a.foo - b.foo
        };

        assert.deepEqual(
            query('sort(#.sorting)')(data, context),
            data.slice().sort((a, b) => a.foo - b.foo)
        );
    });

    describe('with sorting function', () => {
        const data = [1, 2, 3, 2, 1, 4].map((value, idx) => ({ idx, foo: value }));

        it('single attribute', () => {
            assert.deepEqual(
                query('sort(foo asc)')(data),
                data.slice().sort((a, b) => a.foo - b.foo)
            );
        });

        it('by variable', () => {
            assert.deepEqual(
                query('$sorting: foo asc; sort($sorting)')(data),
                data.slice().sort((a, b) => a.foo - b.foo)
            );
        });

        it('a couple of attributes', () => {
            assert.deepEqual(
                query('sort(foo asc, idx desc)')(data),
                data.slice().sort((a, b) => (a.foo - b.foo) || (b.idx - a.idx))
            );
        });

        it('a triplet of attributes', () => {
            const data = [
                { a: 1, b: 4, c: 2 },
                { a: 1, b: 4, c: 1 },
                { a: 1, b: 3, c: 1 },
                { a: 1, b: 3, c: 2 },
                { a: 2, b: 5, c: 1 },
                { a: 2, b: 5, c: 2 },
                { a: 2, b: 5, c: 1 },
                { a: 2, b: 5, c: 2 },
                { a: 3, b: 3, c: 1 },
                { a: 3, b: 2, c: 1 },
                { a: 3, b: 2, c: 2 }
            ];

            assert.deepEqual(
                query('sort(a desc, b asc, c desc)')(data),
                data.slice().sort((a, b) => (b.a - a.a) || (a.b - b.b) || (b.c - a.c))
            );
        });
    });

    describe('mixed value types', () => {
        const filterUndefined = (arr) => arr.filter(x => x !== undefined);
        const fn = () => {};
        const data = [
            true,
            1,
            'z',
            -Infinity,
            4,
            false,
            'b',
            { c: 1 },
            '2',
            null,
            { b: 1 },
            undefined,
            NaN,
            Infinity,
            fn
        ];

        it('asc', () => {
            const expected = [
                false,
                true,
                NaN,
                -Infinity,
                1,
                4,
                Infinity,
                '2',
                'b',
                'z',
                null,
                { c: 1 },
                { b: 1 },
                fn,
                undefined
            ];

            assert.deepEqual(
                escapeNaN(query('sort()')(data)),
                escapeNaN(expected)
            );
            assert.deepEqual(
                escapeNaN(query('sort()')(filterUndefined(data))),
                escapeNaN(filterUndefined(expected))
            );
        });
        it('desc', () => {
            const expected = [
                fn,
                { c: 1 },
                { b: 1 },
                null,
                'z',
                'b',
                '2',
                Infinity,
                4,
                1,
                -Infinity,
                NaN,
                true,
                false,
                undefined
            ];

            assert.deepEqual(
                escapeNaN(query('sort($ desc)')(data)),
                escapeNaN(expected)
            );
            assert.deepEqual(
                escapeNaN(query('sort($ desc)')(filterUndefined(data))),
                escapeNaN(filterUndefined(expected))
            );
        });

        it('undefined should be always last', () => {
            assert.deepEqual(
                query('sort()')([
                    1, 'zzz', undefined, 4, 'asd', undefined, 3, undefined, 2
                ]),
                [
                    1, 2, 3, 4, 'asd', 'zzz', undefined, undefined, undefined
                ]
            );
        });
    });

    describe('natural sorting', () => {
        const data = [
            null,
            false,
            123,
            NaN,
            '123%',
            '23%',
            '10.100.50.50',
            '10.20.50.100',
            '10.9.100.55',
            '5.6.7.8',
            '10.9.50.10',
            'string-100',
            'string-50',
            'string-9',
            'string-055',
            'xyz',
            '  asd',
            'abc',
            true
        ];
        const expected = [
            false,
            true,
            NaN,
            '5.6.7.8',
            '10.9.50.10',
            '10.9.100.55',
            '10.20.50.100',
            '10.100.50.50',
            '23%',
            123,
            '123%',
            'abc',
            '  asd',
            'string-9',
            'string-50',
            'string-055',
            'string-100',
            'xyz',
            null
        ];

        it('asc', () => {
            assert.deepEqual(
                escapeNaN(query('sort($ ascN)')([...data])),
                escapeNaN(expected)
            );
        });

        it('desc', () => {
            assert.deepEqual(
                escapeNaN(query('sort($ descN)')([...data])),
                escapeNaN([...expected].reverse())
            );
        });
    });

    describe('analytical sorting', () => {
        const data = [
            null,
            false,
            55,
            123,
            1,
            NaN,
            '123%',
            '23%',
            '10.100.50.50',
            '10.20.50.100',
            '10.9.100.55',
            '5.6.7.8',
            '10.9.50.10',
            'string-100',
            'string-50',
            'string-9',
            'string-055',
            'xyz',
            '  asd',
            'abc',
            true
        ];
        const expected = [
            false,
            true,
            NaN,
            123,
            55,
            1,
            '  asd',
            '10.100.50.50',
            '10.20.50.100',
            '10.9.100.55',
            '10.9.50.10',
            '123%',
            '23%',
            '5.6.7.8',
            'abc',
            'string-055',
            'string-100',
            'string-50',
            'string-9',
            'xyz',
            null
        ];

        it('asc', () => {
            assert.deepEqual(
                escapeNaN(query('sort($ ascA)')([...data])),
                escapeNaN(expected)
            );
        });

        it('desc', () => {
            assert.deepEqual(
                escapeNaN(query('sort($ descA)')([...data])),
                escapeNaN([...expected].reverse())
            );
        });
    });

    describe('analytical natural sorting', () => {
        const data = [
            null,
            false,
            123,
            NaN,
            '123%',
            '23%',
            '10.100.50.50',
            '10.20.50.100',
            '10.9.100.55',
            '5.6.7.8',
            '10.9.50.10',
            'string-100',
            'string-50',
            'string-9',
            'string-055',
            'xyz',
            '  asd',
            'abc',
            true
        ];
        const expected = [
            false,
            true,
            NaN,
            123,
            '123%',
            '23%',
            '10.100.50.50',
            '10.20.50.100',
            '10.9.100.55',
            '10.9.50.10',
            '5.6.7.8',
            'abc',
            '  asd',
            'string-100',
            'string-055',
            'string-50',
            'string-9',
            'xyz',
            null
        ];

        it('asc (AN)', () => {
            assert.deepEqual(
                escapeNaN(query('sort($ ascAN)')([...data])),
                escapeNaN(expected)
            );
        });
        it('asc (NA)', () => {
            assert.deepEqual(
                escapeNaN(query('sort($ ascNA)')([...data])),
                escapeNaN(expected)
            );
        });

        it('desc (AN)', () => {
            assert.deepEqual(
                escapeNaN(query('sort($ descAN)')([...data])),
                escapeNaN([...expected].reverse())
            );
        });
        it('desc (NA)', () => {
            assert.deepEqual(
                escapeNaN(query('sort($ descNA)')([...data])),
                escapeNaN([...expected].reverse())
            );
        });
    });
});
