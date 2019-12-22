const assert = require('assert');
const query = require('./helpers/lib');

describe('split()', () => {
    it('split string by string', () => {
        assert.deepEqual(
            query('split(",")')('1,2,3'),
            ['1', '2', '3']
        );
    });

    it('split string by regexp', () => {
        assert.deepEqual(
            query('split(/\\s*,\\s*/)')('1, 2 ,3 , 4,5'),
            ['1', '2', '3', '4', '5']
        );
    });

    it('split string by regexp with groups', () => {
        assert.deepEqual(
            query('split(/(,)/)')('1,2,3,4,5'),
            ['1', ',', '2', ',', '3', ',', '4', ',', '5']
        );
    });

    it('split non-string', () => {
        assert.deepEqual(
            query('split(".")')(123.456),
            ['123', '456']
        );
    });
});
