import assert from 'assert';
import jora from 'jora';

describe('custom methods', () => {
    describe('method as function', () => {
        it('basic', () => {
            assert.strictEqual(
                jora('test()', {
                    methods: { test: () => 42 }
                })(),
                42
            );
        });

        it('with arguments', () => {
            assert.strictEqual(
                jora('40.test(2)', {
                    methods: {
                        test(current, arg1) {
                            return current + arg1;
                        }
                    }
                })(),
                42
            );
        });

        it('should contain a reference to the query context', () => {
            assert.strictEqual(
                jora('40.test()', {
                    methods: {
                        test(current) {
                            return this.context.foo + current;
                        }
                    }
                })(null, { foo: 2 }),
                42
            );
        });

        it('other builtin and custom methods should be available', () => {
            assert.strictEqual(
                jora('40.test()', {
                    methods: {
                        test() {
                            return this.method('m1') + this.method('m2') + this.method('size', [1, 2]);
                        },
                        m1: () => 30,
                        m2: '10'
                    }
                })(),
                42
            );
        });
    });

    describe('method as string', () => {
        it('basic', () => {
            assert.strictEqual(
                jora('test()', {
                    methods: {
                        test: '40 + 2'
                    }
                })(),
                42
            );
        });

        it('all special references should be defined', () => {
            const ctx = { context: true };
            assert.deepStrictEqual(
                jora('40.test(2)', {
                    methods: {
                        test: '{ "$": $, "$$": $$, "@": @, "#": # }'
                    }
                })({}, ctx),
                {
                    '$': 40,
                    '$$': 2,
                    '@': 40,
                    '#': ctx
                }
            );
        });

        it('other builtin and custom methods should be available', () => {
            assert.deepStrictEqual(
                jora('40.test(2)', {
                    methods: {
                        test: 'm1() + m2() + [1, 2].size()',
                        m1: () => 30,
                        m2: '10'
                    }
                })(),
                42
            );
        });
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
