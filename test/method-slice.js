const assert = require('assert');
const data = require('./fixture/simple');
const query = require('../src');

describe('slice()', () => {
    describe('array', () => {
        it('with no arguments', () =>
            assert.deepEqual(
                query('filename.slice()')(data),
                ['1.css', '2.js', '3.svg', '4.js', '5.js', '6.css', '7.css']
            )
        );

        it('with offset only', () =>
            assert.deepEqual(
                query('filename.slice(1)')(data),
                ['2.js', '3.svg', '4.js', '5.js', '6.css', '7.css']
            )
        );

        it('with offset and length', () =>
            assert.deepEqual(
                query('filename.slice(1, 3)')(data),
                ['2.js', '3.svg']
            )
        );
    });

    describe('string', () => {
        it('with no arguments', () =>
            assert.deepEqual(
                query('slice()')('1.css'),
                '1.css'
            )
        );

        it('with offset only', () =>
            assert.deepEqual(
                query('slice(1)')('1.css'),
                '.css'
            )
        );

        it('with offset and length', () =>
            assert.deepEqual(
                query('slice(1, 2)')('1.css'),
                '.'
            )
        );
    });
});
