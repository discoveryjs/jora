import assert from 'assert';
import query from 'jora';
import data from '../helpers/fixture.js';

describe('group()', () => {
    it('basic', () => {
        assert.deepEqual(
            query('.group(=>type)')(data),
            ['css', 'js', 'svg']
                .map(type => ({
                    key: type,
                    value: data.filter(item => item.type === type)
                }))
        );
    });

    it('should take second argument as map function for values', () => {
        assert.deepEqual(
            query('.group(=>type, =>filename)')(data),
            ['css', 'js', 'svg']
                .map(type => ({
                    key: type,
                    value: data
                        .filter(item => item.type === type)
                        .map(item => item.filename)
                }))
        );
    });

    it('should be applicable for non-array values', () => {
        assert.deepEqual(
            query('.group(=>type)')(data[0]),
            [{ key: 'css', value: [data[0]] }]
        );
    });

    it('should produce undefined key for each item when key fetcher is not set or not a function', () => {
        assert.deepEqual(
            query('.group()')(data),
            [{ key: undefined, value: data }]
        );
    });

    it('should group by an element when key value is an array', () => {
        const data = [
            { id: 1, tags: ['foo', 'bar'] },
            { id: 2, tags: ['baz'] },
            { id: 3, tags: ['bar', 'baz'] },
            { id: 4, tags: ['bar'] }
        ];

        assert.deepEqual(
            query('group(=>tags)')(data),
            [
                { key: 'foo', value: [data[0]] },
                { key: 'bar', value: [data[0], data[2], data[3]] },
                { key: 'baz', value: [data[1], data[2]] }
            ]
        );
    });

    it('should not loose elements with empty array', () => {
        const data = [
            { id: 1, tags: ['foo', 'bar'] },
            { id: 2, tags: ['baz'] },
            { id: 3, tags: ['bar', 'baz'] },
            { id: 4, tags: [] }
        ];

        assert.deepEqual(
            query('group(=>tags)')(data),
            [
                { key: 'foo', value: [data[0]] },
                { key: 'bar', value: [data[0], data[2]] },
                { key: 'baz', value: [data[1], data[2]] },
                { key: undefined, value: [data[3]] }
            ]
        );
    });

    describe('should work with TypedArrays', () => {
        it('group TypedArray elements', () => {
            assert.deepEqual(
                query('group(=>$ % 2 ? "odd" : "even")')(new Uint8Array([1, 2, 3, 4, 5])),
                [
                    { key: 'odd', value: [1, 3, 5] },
                    { key: 'even', value: [2, 4] }
                ]
            );
        });

        it('group by TypedArray', () => {
            const data = [
                { id: 1, tags: new Uint8Array([1, 2]) },
                { id: 2, tags: new Uint8Array([2, 3]) },
                { id: 3, tags: new Uint8Array([3, 4]) },
                { id: 4, tags: new Uint8Array([]) }
            ];

            assert.deepEqual(
                query('group(=>tags)')(data),
                [
                    { key: 1, value: [data[0]] },
                    { key: 2, value: [data[0], data[1]] },
                    { key: 3, value: [data[1], data[2]] },
                    { key: 4, value: [data[2]] },
                    { key: undefined, value: [data[3]] }
                ]
            );
        });
    });
});
