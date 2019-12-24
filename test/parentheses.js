const assert = require('assert');
const query = require('./helpers/lib');
const data = require('./helpers/fixture');

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

    it('should allow definitions inside', () => {
        assert.deepEqual(
            query('$a: "hello"; ($b:" world"; $b).($a + $)')(),
            'hello world'
        );
    });
});
