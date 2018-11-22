const assert = require('assert');
const data = require('./fixture/simple');
const query = require('../src');

describe('filter', () => {
    it('should filter a current array', () => {
        assert.deepEqual(
            query('.[type="js"]')(data),
            data
                .filter(item => item.type === 'js')
        );
    });

    it('should treat empty arrays as false in filter', () => {
        assert.deepEqual(
            query('.[errors]')(data),
            data
                .filter(item => item.errors && item.errors.length)
        );
    });

    it('should treat empty objects as false in filter', () => {
        assert.deepEqual(
            query('.[deps]')(data),
            data
                .filter(item => item.deps && Object.keys(item.deps).length > 0)
        );
    });

    it('should allow following filters', () => {
        assert.deepEqual(
            query('.[deps].[type="js"]')(data),
            data
                .filter(item => item.deps && Object.keys(item.deps).length > 0)
                .filter(item => item.type === 'js')
        );
    });

    it('should allow path before filter', () => {
        assert.deepEqual(
            query('refs.[broken]')(data),
            data
                .reduce((res, item) => res.concat(item.refs || []), [])
                .filter(item => item.broken)
        );
    });

    it('should allow following path', () => {
        assert.deepEqual(
            query('.[deps].type')(data),
            [...new Set(
                data
                    .filter(item => item.deps && Object.keys(item.deps).length > 0)
                    .map(item => item.type)
            )]
        );

        assert.deepEqual(
            query('.[no deps].errors.owner.type')(data),
            ['js']
        );
    });

    it('should use current for $', () => {
        assert.deepEqual(
            query('filename.[$="2.js"]')(data),
            data
                .map(item => item.filename)
                .filter(item => item === '2.js')
        );

        assert.deepEqual(
            query('errors.owner.[type="css"]')(data),
            [data[6]]
        );
    });

    it('path before and after', () => {
        assert.deepEqual(
            query('errors.owner.[type="css"].type')(data),
            ['css']
        );
    });

    it('should use context for #', () => {
        assert.deepEqual(
            query('.[$=#]')(data, data[1]),
            data
                .filter(item => item === data[1])
        );
    });

    it('should use data for @', () => {
        assert.deepEqual(
            query('.[$ in @.errors.owner].filename')(data),
            data
                .reduce((res, item) => res.concat(item.errors.map(item => item.owner)), [])
                .map(item => item.filename)
        );
    });

    it('optional whitespaces inside brackets', () => {
        assert.deepEqual(
            query('.[ errors ]')(data),
            data
                .filter(item => item.errors && item.errors.length)
        );
    });

    it('should allow to use on separate line', () => {
        assert.deepEqual(
            query('errors.owner\n.[type="css"]\n.type')(data),
            ['css']
        );
    });
});
