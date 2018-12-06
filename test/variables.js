const assert = require('assert');
const data = require('./fixture/simple');
const query = require('../src');

describe('definitions', () => {
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

    it('should throw when duplicate name', () => {
        assert.throws(
            () => query('$a:42;$a:43;')(data),
            /Identifier '\$a' has already been declared/
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

    describe('should throw when reserved name is used for a definition', () => {
        const preserved = ['$data', '$context', '$ctx', '$array', '$idx', '$index'];

        preserved.forEach(name =>
            it(name, () =>
                assert.throws(
                    () => query(name + ':1;')(),
                    new RegExp('Identifier \'\\' + name + '\' has already been declared')
                )
            )
        );
    });
});
