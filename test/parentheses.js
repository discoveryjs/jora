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

    it('should produce an array', () => {
        assert.deepEqual(
            query('()')(data),
            []
        );

        assert.deepEqual(
            query('(1)')(data),
            [1]
        );

        assert.deepEqual(
            query('(1, 2)')(data),
            [1, 2]
        );
    });

    it('should produce an empty array when single term is falsy', () => {
        assert.deepEqual(
            query('(0)')(data),
            []
        );

        assert.deepEqual(
            query('({})')(data),
            []
        );
    });
});
