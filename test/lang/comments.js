import assert from 'assert';
import query from 'jora';
import data from '../helpers/fixture.js';

describe('lang/comments', () => {
    describe('single-line', () => {
        it('basic', () => {
            assert.deepEqual(
                query('// empty query')(data),
                data
            );
        });

        it('multiple #1', () => {
            assert.deepEqual(
                query(`
                    errors
                    // comments
                    .owner
                    // can be
                    .[type="css"]// at any place
                    // until the line ending
                    .type
                `)(data),
                ['css']
            );
        });

        it('multiple #2', () => {
            assert.deepEqual(
                query(`
                    (errors)
                    // comments
                    .owner
                    // can be
                    // at any place
                    .[type="css"]
                    // and contain /anything/ you like "foo/bar"
                    .type
                    // until the
                    // line ending
                `)(data),
                ['css']
            );
        });

        it('with parentheses', () => {
            assert.deepEqual(
                query('(1)\n//\n///\n')(data),
                1
            );
        });
    });

    describe('multi-line', () => {
        it('basic', () => {
            assert.deepEqual(
                query('/* empty query */')(data),
                data
            );
        });

        it('multiple #1', () => {
            assert.deepEqual(
                query(`
                    errors
                    /*comments*/
                    .owner /*
                    // can be
                    */ .[type=/* at */"css"]/* any place
                    until the line ending */
                    .type
                `)(data),
                ['css']
            );
        });

        it('multiple #2', () => {
            assert.deepEqual(
                query(`
                    (errors)
                    /* comments */
                    .owner
                    /* can be
                       at any place */
                    .[type="css"]
                    /* and contain /anything/ you like "foo/bar" */
                    .type
                    /* until the
                    line ending
                `)(data),
                ['css']
            );
        });

        it('with parentheses', () => {
            assert.deepEqual(
                query('(1)\n/*\n/\n*/')(data),
                1
            );
        });
    });

    it('mixed', () => {
        assert.deepEqual(
            query(`
                (errors)
                // comments
                .owner
                /* can be
                at any place */
                .[type="css"]
                // and contain /anything/ you like "foo/bar"
                .type /*
                until the
                line ending
            `)(data),
            ['css']
        );
    });
});
