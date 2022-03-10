import assert from 'assert';
import jora from 'jora';

const { setup } = jora;
const malformedQuery = '42 +';

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
            test: () => 42,
            withArgs: (current, arg1) => current + arg1
        });

        assert.strictEqual(
            customQuery('test()')(),
            42
        );
        assert.strictEqual(
            customQuery('40.withArgs(2)')(),
            42
        );
    });

    it('with custom methods as string', () => {
        const customQuery = setup({
            test: '40 + 2',
            withThis: '$ + $'
        });

        assert.strictEqual(
            customQuery('test()')(),
            42
        );
        assert.strictEqual(
            customQuery('21.withThis()')(),
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

    it('should return the same function for a query', () => {
        const customQuery = setup();

        assert.strictEqual(
            customQuery('size()'),
            customQuery('size()')
        );
    });

    it('should support tolerant mode', () => {
        const customQuery = setup();

        assert.throws(() => customQuery(malformedQuery));
        assert.doesNotThrow(() => customQuery(malformedQuery, { tolerant: true }));
    });

    it('should support stat mode', () => {
        const customQuery = setup();
        const res = customQuery('size()', { stat: true })();

        assert.strictEqual(typeof res.stat, 'function', 'Should has stat method');
        assert.strictEqual(typeof res.suggestion, 'function', 'Should has stat method');
    });

    it('should support stat + tolerant mode', () => {
        const customQuery = setup();
        const res = customQuery(malformedQuery, { stat: true, tolerant: true })();

        assert.strictEqual(typeof res.stat, 'function', 'Should has stat method');
        assert.strictEqual(typeof res.suggestion, 'function', 'Should has stat method');
    });
});
