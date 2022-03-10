import assert from 'assert';
import query from 'jora';
import data from './helpers/fixture.js';

describe('lang/data roots', () => {
    it('should return <data> when query is empty', () => {
        assert.deepEqual(
            query('')(data),
            data
        );
    });

    it('should refer to <data> when @ is using', () => {
        assert.deepEqual(
            query('@')(data),
            data
        );
    });

    it('should refer to <context> when # is using', () => {
        assert.deepEqual(
            query('#')(data, data[0]),
            data[0]
        );
    });

    it('a symbol can be a data root (alias to $.symbol)', () => {
        assert.deepEqual(
            query('errors')(data),
            query('$.errors')(data)
        );
    });

    it('a string can be a data root', () => {
        assert.deepEqual(
            query('"test".({ foo: $ })')(data),
            { foo: 'test' }
        );
    });

    it('a number can be a data root', () => {
        assert.deepEqual(
            query('42.({ foo: $ })')(data),
            { foo: 42 }
        );

        assert.deepEqual(
            query('4.2.({ foo: $ })')(data),
            { foo: 4.2 }
        );

        assert.deepEqual(
            query('4.({ foo: $ })')(data),
            { foo: 4 }
        );
    });

    it('a regexp can be a data root', () => {
        assert.deepEqual(
            query('/rx/.({ foo: $ })')(data),
            { foo: /rx/ }
        );
    });

    it('an object can be a data root', () => {
        assert.deepEqual(
            query('{ foo: 1 }.({ foo: foo > 0 })')(data),
            { foo: true }
        );
    });
});
