import assert from 'assert';
import jora from 'jora';

describe('custom assertions', () => {
    describe('assertion as function', () => {
        it('basic', () => {
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

        it('special references should be available', () => {
            assert.deepStrictEqual(
                jora('[is current, is data, # is context]', {
                    assertions: {
                        current: '$ = 2',
                        data: '$ = 2',
                        context: '$ = #'
                    }
                })(2, { ctx: true }),
                [true, true, true]
            );
        });

        it('other builtin and custom assertions should available', () => {
            assert.deepStrictEqual(
                jora('is test', {
                    assertions: {
                        test() {
                            return (
                                this.assertion('a1', 3) &&
                                this.assertion('a2', 4) &&
                                this.assertion('number', 5)
                            );
                        },
                        a1: ($) => $ === 3,
                        a2: '$ = 4'
                    }
                })(),
                true
            );
        });
    });

    describe('assertion as string', () => {
        it('basic', () => {
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

        it('special references should be available', () => {
            assert.deepStrictEqual(
                jora('[is current, is data, # is context]', {
                    assertions: {
                        current: '$ = 2',
                        data: '$ = 2',
                        context: '$ = #'
                    }
                })(2, { ctx: true }),
                [true, true, true]
            );
        });

        it('other builtin and custom assertions should available', () => {
            assert.deepStrictEqual(
                jora('is test', {
                    assertions: {
                        test: '(3 is a1) and (4 is a2) and (5 is number)',
                        a1: ($) => $ === 3,
                        a2: '$ = 4'
                    }
                })(),
                true
            );
        });
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
