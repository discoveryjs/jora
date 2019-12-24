const assert = require('assert');
const query = require('./helpers/lib');
const data = require('./helpers/fixture');

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

    it('should return undefined when refer to never defined variable', () => {
        assert.deepEqual(
            query('$a:$b;$a')(),
            undefined
        );
    });

    it('should overlap a variable defined in parent scope', () => {
        assert.deepEqual(
            query('$a:2;.($a:20;$a * 2) + $a')(0),
            42
        );
    });

    it('should throw when access before initialization', () => {
        assert.throws(
            () => query('$a:$a;')(),
            /\$a is not defined|Cannot access '\$a' before initialization/
        );
    });

    it('should return a value when access after initialization', () => {
        assert.deepEqual(
            query('$a:=>foo.map($a) or foo;{ foo: { foo: 42 }}.map($a)')(),
            42
        );
    });

    it('should throw when redefine a variable defined in the same scope', () => {
        assert.throws(
            () => query('$a;$a;')(),
            /Identifier '\$a' has already been declared/
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
                        new RegExp('Identifier \'\\' + name + '\' is reserved for future use')
                    );
                })
            )
        );

        describe('nested', () =>
            preserved.forEach(name =>
                it(name, () => {
                    assert.throws(
                        () => query('.(' + name + ':1;)')(),
                        new RegExp('Identifier \'\\' + name + '\' is reserved for future use')
                    );
                })
            )
        );
    });
});
