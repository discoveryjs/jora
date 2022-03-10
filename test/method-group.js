import assert from 'assert';
import query from 'jora';
import data from './helpers/fixture.js';

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
        assert.deepEqual(
            query('.group(=>refs.type)')(data),
            ['svg', 'css', 'js']
                .map(type => ({
                    key: type,
                    value: data.filter(item => item.refs.find(ref => ref.type === type))
                }))
        );
    });
});
