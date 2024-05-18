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
});
