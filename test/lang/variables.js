import assert from 'assert';
import query from 'jora';
import data from '../helpers/fixture.js';

describe('lang/variables', () => {
    it('define a value', () => {
        assert.deepEqual(
            query('$a:42;')(data),
            data
        );
    });

    it('using a definition', () => {
        assert.deepEqual(
            query('$a:42;$a')(),
            42
        );

        assert.deepEqual(
            query('$a:42;$a / 2')(),
            21
        );
    });

    it('define with no value', () => {
        assert.deepEqual(
            query('$a;$a')({ a: 42 }),
            42
        );
    });

    it('whitespaces should be optional', () => {
        assert.deepEqual(
            query('$a ; $b : 2 ; $a * $b')({ a: 21 }),
            42
        );
    });

    it('should destruct to a regular key when using in short form on object', () => {
        assert.deepEqual(
            query('$a;{$a}')({ a: 42 }),
            { a: 42 }
        );
    });

    it('should raise an exception when refer to undefined variable', () => {
        assert.throws(
            () => query('$a:$b;$a')(),
            /\$b is not defined/
        );
    });

    it('should return undefined when refer to undefined variable in tolerant mode', () => {
        assert.deepEqual(
            query('$a:$b;$a', { tolerant: true })(),
            undefined
        );
    });

    it('should overlap a variable defined in parent scope', () => {
        assert.deepEqual(
            query('$a:2;.($a:20;$a * 2) + $a')(0),
            42
        );
    });

    describe('should throw when access before initialization', () => {
        it('self reference', () => {
            assert.throws(
                () => query('$a:$a;')(),
                /Cannot access \$a before initialization/
            );
        });

        it('same scope', () => {
            assert.throws(
                () => query('$a:$b;$b;')(),
                /Cannot access \$b before initialization/
            );
        });

        it('inner scope to same scope', () => {
            assert.throws(
                () => query('$a:1;|$b:2;$c:$b;$d:$a;$a:3;4')(),
                /Cannot access \$a before initialization/
            );
        });

        it('inner scope to outer scope', () => {
            assert.throws(
                () => query('$a:1;$b:($c:$d;1);$d:1;')(),
                /Cannot access \$d before initialization/
            );
        });

        it('inner scope to outer scope on initing var', () => {
            assert.throws(
                () => query('$a:1;$b:($c:$b;1);$d:1;')(),
                /Cannot access \$b before initialization/
            );
        });

        it('should not break outer await', () => {
            assert.throws(
                () => query('$a:1;$b:($d:1;1);$c:$d;$d:1;')(),
                /Cannot access \$d before initialization/
            );
        });
    });

    describe('should not leak to globals', () => {
        before(() => {
            global.$test = 123;
        });
        after(() => {
            delete global.$test;
        });
        it('should throw when access before initialization', () => {
            assert.throws(
                () => query('$test')(),
                /\$test is not defined/
            );
        });
    });

    it('should return a value when access after initialization', () => {
        assert.deepEqual(
            query('$a:=>foo.map($a) or foo;{ foo: { foo: 42 }}.map($a)')(),
            42
        );
    });

    it('should return a value when access after initialization #2', () => {
        assert.deepEqual(
            query('$a:=>$b;$b:42;0.map($a)')(),
            42
        );
    });

    it('should throw when redefine a variable defined in the same scope', () => {
        assert.throws(
            () => query('$a;$a;')(),
            /Identifier "\$a" has already been declared/
        );
    });

    it('should not throw when variables with the same name defined in another scope', () => {
        assert.doesNotThrow(
            () => query('$a;.($b;) + .($b;)')()
        );
    });

    describe('should be parse error when a whitespace between $ and indent', () => {
        it('in definition', () => {
            assert.throws(
                () => query('$ a : 1;')(),
                /Parse error/
            );
        });

        it('in reference', () => {
            assert.throws(
                () => query('$a:1; $ a')(),
                /Parse error/
            );
        });

        it('in object literal', () => {
            assert.throws(
                () => query('{ $ a : 1 }')(),
                /Parse error/
            );
        });
    });

    describe('should throw when reserved name is used for a definition', () => {
        const preserved = ['$data', '$context', '$ctx', '$array', '$idx', '$index'];

        describe('top-level', () =>
            preserved.forEach(name =>
                it(name, () => {
                    assert.throws(
                        () => query(name + ':1;')(),
                        new RegExp(`Identifier "\\${name}" is reserved for future use`)
                    );
                })
            )
        );

        describe('nested', () =>
            preserved.forEach(name =>
                it(name, () => {
                    assert.throws(
                        () => query('.(' + name + ':1;)')(),
                        new RegExp(`Identifier "\\${name}" is reserved for future use`)
                    );
                })
            )
        );
    });
});
