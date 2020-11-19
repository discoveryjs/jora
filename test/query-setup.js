const assert = require('assert');
const jora = require('./helpers/lib');
const { setup } = jora;

describe('query/setup', () => {
    it('with no args', () => {
        const customQuery = setup();

        assert.strictEqual(
            customQuery('size()')('foo'),
            3
        );
    });

    it('with custom methods', () => {
        const customQuery = setup({
            test: () => 42
        });

        assert.strictEqual(
            customQuery('test()')(),
            42
        );
    });

    it('should override buildin methods', () => {
        const customQuery = setup({
            size: () => 42
        });

        assert.strictEqual(
            customQuery('size()')('foo'),
            42
        );
    });

    it('should not affect others', () => {
        const customQuery1 = setup({
            test: () => 1
        });
        const customQuery2 = setup({
            test: () => 2
        });

        assert.strictEqual(customQuery1('test()')(), 1);
        assert.strictEqual(customQuery2('test()')(), 2);
        assert.throws(() => jora('test()')(), /test is not a function/);
    });
});
