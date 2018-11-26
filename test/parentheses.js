const assert = require('assert');
const data = require('./fixture/simple');
const query = require('../src');

describe('parentheses', () => {
    it('basic', () => {
        assert.deepEqual(
            query('.[not (errors and type="js")]')(data),
            data
                .filter(item => !((item.errors && item.errors.length) && item.type === 'js'))
        );
    });

    it('should not change the meaning', () => {
        assert.deepEqual(
            query('.[not (errors) and (type="js")]')(data),
            data
                .filter(item => !(item.errors && item.errors.length) && item.type === 'js')
        );
    });

    it('should allow optional whitespaces inside', () => {
        assert.deepEqual(
            query('.[not ( errors ) and ( type="js" )]')(data),
            data
                .filter(item => !(item.errors && item.errors.length) && item.type === 'js')
        );
    });
});
