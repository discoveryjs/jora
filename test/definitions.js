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

    it('unsing a definition', () => {
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
});
