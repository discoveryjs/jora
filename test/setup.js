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

    describe('custom methods', () => {
        it('method as function', () => {
            const customQuery = setup({
                methods: {
                    test: () => 42,
                    withArgs: (current, arg1) => current + arg1
                }
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

        it('method as string', () => {
            const customQuery = setup({
                methods: {
                    test: '40 + 2',
                    withThis: '$$' // '$ + $$'
                }
            });

            assert.strictEqual(
                customQuery('test()')(),
                42
            );
            assert.strictEqual(
                customQuery('40.withThis(2)')(),
                undefined
            );
        });

        it('should throw on built-in method override', () => {
            assert.throws(
                () => setup({ methods: { size: () => 42 } }),
                /Builtin method "size" can't be overridden/
            );
        });

        it('should not affect other setups', () => {
            const customQuery1 = setup({
                methods: {
                    test1: () => 1
                }
            });
            const customQuery2 = setup({
                methods: {
                    test2: () => 2
                }
            });

            assert.strictEqual(customQuery1('test1()')(), 1);
            assert.strictEqual(customQuery2('test2()')(), 2);
            assert.throws(() => customQuery1('test2()')(), /Method "test2" is not defined/);
            assert.throws(() => customQuery2('test1()')(), /Method "test1" is not defined/);
            assert.throws(() => jora('test1()')(), /Method "test1" is not defined/);
            assert.throws(() => jora('test2()')(), /Method "test2" is not defined/);
        });
    });

    describe('custom assertions', () => {
        it('assertion as function', () => {
            const customQuery = setup({
                assertions: {
                    custom: $ => $ == 42
                }
            });

            assert.strictEqual(
                customQuery('is custom')(),
                false
            );
            assert.strictEqual(
                customQuery('is custom')(41),
                false
            );
            assert.strictEqual(
                customQuery('is custom')(42),
                true
            );
        });

        it('assertion as string', () => {
            const customQuery = setup({
                assertions: {
                    custom: '$ = 42'
                }
            });

            assert.strictEqual(
                customQuery('is custom')(),
                false
            );
            assert.strictEqual(
                customQuery('is custom')(41),
                false
            );
            assert.strictEqual(
                customQuery('is custom')(42),
                true
            );
        });

        it('should thow on built-in assertion override', () => {
            assert.throws(
                () => setup({ assertions: { number: () => 42 } }),
                /Builtin assertion "number" can't be overridden/
            );
        });

        it('should not affect other setups', () => {
            const customQuery1 = setup({
                assertions: {
                    test1: $ => $ === 1
                }
            });
            const customQuery2 = setup({
                assertions: {
                    test2: $ => $ === 2
                }
            });

            assert.strictEqual(customQuery1('is test1')(1), true);
            assert.strictEqual(customQuery1('is test1')(2), false);
            assert.strictEqual(customQuery2('is test2')(1), false);
            assert.strictEqual(customQuery2('is test2')(2), true);
            assert.throws(() => customQuery1('is test2')(), /Assertion "test2" is not defined/);
            assert.throws(() => customQuery2('is test1')(), /Assertion "test1" is not defined/);
            assert.throws(() => jora('is test1')(), /Assertion "test1" is not defined/);
            assert.throws(() => jora('is test2')(), /Assertion "test2" is not defined/);
        });
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
