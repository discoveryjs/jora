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
            test1: () => 1
        });
        const customQuery2 = setup({
            test2: () => 2
        });

        assert.strictEqual(customQuery1('test1()')(), 1);
        assert.strictEqual(customQuery2('test2()')(), 2);
        assert.throws(() => customQuery1('test2()')(), /Method "test2" is not defined/);
        assert.throws(() => customQuery2('test1()')(), /Method "test1" is not defined/);
        assert.throws(() => jora('test1()')(), /Method "test1" is not defined/);
        assert.throws(() => jora('test2()')(), /Method "test2" is not defined/);
    });
});
