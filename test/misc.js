const assert = require('assert');
const data = require('./fixture/simple');
const query = require('../src');

describe('misc', () => {
    it('can be used with template literals', () => {
        assert.deepEqual(
            query`filename`(data),
            data
                .map(item => item.filename)
        );
    });

    it('comments', () => {
        assert.deepEqual(
            query('// empty query')(data),
            data
        );

        assert.deepEqual(
            query(`
                errors
                // comments
                .owner
                // can be
                [type="css"]// at any place
                // until the line ending
                .type
            `)(data),
            ['css']
        );

        assert.deepEqual(
            query(`
                (errors)
                // comments
                .owner
                // can be
                // at any place
                [type="css"]
                // and contain /anything/ you like "foo/bar"
                .type
                // until the
                // line ending
            `)(data),
            ['css']
        );

        assert.deepEqual(
            query('(1)\n//\n///\n')(data),
            [1]
        );
    });
});
