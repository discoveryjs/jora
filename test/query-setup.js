const assert = require('assert');
const { setup } = require('./helpers/lib');

describe('query/setup', () => {
    it('with no args', () => {
        const query = setup();

        assert.strictEqual(
            query('size()')('foo'),
            3
        );
    });

    it('with custom methods', () => {
        const query = setup({
            test: () => 42
        });

        assert.deepEqual(
            query('test()')(),
            42
        );
    });

    it('should override buildin methods', () => {
        const query = setup({
            size: () => 42
        });

        assert.deepEqual(
            query('size()')('foo'),
            42
        );
    });
});
