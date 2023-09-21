import assert from 'assert';
import jora from 'jora';

describe.skip('query extensions', () => {
    describe('custom methods', () => {
        it('method as function', () => {
            assert.strictEqual(
                jora('test()', {
                    methods: { test: () => 42 }
                })(),
                42
            );
            assert.strictEqual(
                jora('40.withArgs(2)', {
                    methods: {
                        withArgs: (current, arg1) => current + arg1
                    }
                })(),
                42
            );
        });

        it('method as string', () => {
            const customQuery = setup({
                methods: {
                    test: '40 + 2',
                    withThis: '$ + $'
                }
            });

            assert.strictEqual(
                customQuery('test()', {
                    methods: {
                        test: '40 + 2'
                    }
                })(),
                42
            );
            assert.strictEqual(
                customQuery('21.withThis()', {
                    methods: {
                        withThis: '$ + $$'
                    }
                })(),
                42
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
});
