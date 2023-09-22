import assert from 'assert';
import jora from 'jora';

describe('query extensions', () => {
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
            assert.strictEqual(
                jora('test()', {
                    methods: {
                        test: '40 + 2'
                    }
                })(),
                42
            );
            assert.strictEqual(
                jora('40.withThis(2)', {
                    methods: {
                        withThis: '$$' // $ + $$
                    }
                })(),
                undefined
            );
        });

        it('should throw on built-in method override', () => {
            assert.throws(
                () => jora('', { methods: { size: () => 42 } }),
                /Builtin method "size" can't be overridden/
            );
        });

        it('should not affect other setups', () => {
            assert.strictEqual(jora('test1()', { methods: { test1: () => 1 } })(), 1);
            assert.strictEqual(jora('test2()', { methods: { test2: () => 2 } })(), 2);
            assert.throws(() => jora('test2()')(), /Method "test2" is not defined/);
            assert.throws(() => jora('test1()')(), /Method "test1" is not defined/);
        });
    });

    describe('custom assertions', () => {
        it('assertion as function', () => {
            assert.strictEqual(
                jora('is custom', {
                    assertions: {
                        custom: $ => $ == 42
                    }
                })(),
                false
            );
            assert.strictEqual(
                jora('is custom', {
                    assertions: {
                        custom: $ => $ == 42
                    }
                })(41),
                false
            );
            assert.strictEqual(
                jora('is custom', {
                    assertions: {
                        custom: $ => $ == 42
                    }
                })(42),
                true
            );
        });

        it('assertion as string', () => {
            assert.strictEqual(
                jora('is custom', {
                    assertions: {
                        custom: '$ = 42'
                    }
                })(),
                false
            );
            assert.strictEqual(
                jora('is custom', {
                    assertions: {
                        custom: '$ = 42'
                    }
                })(41),
                false
            );
            assert.strictEqual(
                jora('is custom', {
                    assertions: {
                        custom: '$ = 42'
                    }
                })(42),
                true
            );
        });

        it('should thow on built-in assertion override', () => {
            assert.throws(
                () => jora('1', { assertions: { number: () => 42 } }),
                /Builtin assertion "number" can't be overridden/
            );
        });

        it('should not affect other setups', () => {
            const s1 = {
                assertions: {
                    test1: $ => $ === 1
                }
            };
            const s2 = {
                assertions: {
                    test2: $ => $ === 2
                }
            };

            assert.strictEqual(jora('is test1', s1)(1), true);
            assert.strictEqual(jora('is test1', s1)(2), false);
            assert.strictEqual(jora('is test2', s2)(1), false);
            assert.strictEqual(jora('is test2', s2)(2), true);
            assert.throws(() => jora('is test2', s1)(), /Assertion "test2" is not defined/);
            assert.throws(() => jora('is test1', s2)(), /Assertion "test1" is not defined/);
        });
    });
});
