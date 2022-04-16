import assert from 'assert';
import jora from 'jora';
import allSyntax from './helpers/all-syntax.js';

const { syntax: { parse, stringify } } = jora;

describe('syntax/stringify', () => {
    it('basic test', () => {
        const actual = stringify(parse(allSyntax).ast);

        assert.equal(actual, allSyntax);
    });

    it('unknown node type', () => {
        assert.throws(
            () => stringify({ type: 'Foo' }),
            /Unknown node type "Foo"/
        );
    });
});
