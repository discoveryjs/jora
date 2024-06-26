import assert from 'assert';
import query from 'jora';
import data from '../helpers/fixture.js';

describe('lang/map', () => {
    it('should be a data root', () => {
        assert.deepEqual(
            query('.(deps + dependants).filename')(data).sort(),
            [...new Set(
                data
                    .reduce((res, item) => res.concat(item.deps, item.dependants), [])
                    .map(item => item.filename)
            )].sort()
        );
    });

    it('should be a subquery', () => {
        assert.deepEqual(
            query('errors.owner.($ + deps + dependants).filename')(data).sort(),
            [...new Set(
                data
                    .reduce((res, item) => res.concat(item.errors.map(item => item.owner)), [])
                    .reduce((res, item) => res.concat(item, item.deps, item.dependants), [])
                    .map(item => item.filename)
            )].sort()
        );
    });

    it('should map to new object', () => {
        assert.deepEqual(
            query('.({ filename, deps: deps.size() })')(data),
            data
                .map(item => ({
                    filename: item.filename,
                    deps: item.deps.length
                }))
        );
    });

    it('should map to empty object', () => {
        assert.deepEqual(
            query('.({})')(data),
            data
                .map(() => ({}))
        );
    });

    it('should support for definitions', () => {
        const expected = data.map(({ filename }) => ({ filename, x: filename === '5.js' }));

        assert.equal(expected.filter(item => item.x).length, 1);

        assert.deepEqual(
            query('.($fn:"5.js";{ filename, x: filename=$fn })')(data),
            expected
        );

        assert.deepEqual(
            query('deep.($fn:"5.js";{ filename, x: filename=$fn })')({ deep: data }),
            expected
        );
    });

    describe('TypedArray support', () => {
        it('mapping of TypedArray', () => {
            const array = new Uint32Array([1, 2, 3, 4, 5]);
            assert.deepEqual(
                query('.($ + 2)')(array),
                [...array.map($ => $ + 2)]
            );
        });
        it('TypedArray as return value', () => {
            const array = [
                { prop: new Uint32Array([1, 2, 3]) },
                { prop: new Uint32Array([2, 3, 4]) }
            ];
            assert.deepEqual(
                query('.(prop)')(array),
                [1, 2, 3, 4]
            );
        });
    });

    it('a whitespace between dot and parenthesis is prohibited', () => {
        assert.throws(
            () => query('. (deps)')(data),
            /Parse error/
        );
    });
});
