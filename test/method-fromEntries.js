import assert from 'assert';
import query from 'jora';

describe('fromEntries()', () => {
    it('basic', () => {
        assert.deepEqual(
            query('.fromEntries()')([
                { key: 'foo', value: 1 },
                { key: 'bar', value: 2 }
            ]),
            {
                foo: 1,
                bar: 2
            }
        );
    });

    it('should return empty object for non-array values', () => {
        assert.deepEqual(
            query('[{ key: "a" }, 123, "asd", true, undefined, null, /asd/].(fromEntries())')(),
            [{}, {}, {}, {}, {}, {}, {}]
        );
    });

    it('should be the opposite method to entries()', () => {
        const data = {
            foo: 1,
            bar: 2
        };

        assert.deepEqual(
            query('entries().fromEntries()')(data),
            data
        );
    });

    it('should be compatible with group()', () => {
        const data = [
            { group: 1, name: 'foo' },
            { group: 2, name: 'bar' },
            { group: 1, name: 'baz' }
        ];

        assert.deepEqual(
            query('group(=>group, =>name).fromEntries()')(data),
            {
                1: ['foo', 'baz'],
                2: ['bar']
            }
        );
    });
});
