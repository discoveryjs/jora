import assert from 'assert';
import jora from 'jora';
import allSyntax from '../helpers/all-syntax.js';

const { syntax: { parse, stringify } } = jora;

describe('syntax/stringify', () => {
    it('basic test', () => {
        const actual = stringify(parse(allSyntax).ast);

        assert.strictEqual(actual, allSyntax);
    });

    it('restore a query from AST after a tolerant parser', () => {
        const query = '$a: ; $b; $; [  and $].[or a =    ][  ] and';
        const actual = stringify(parse(query, true).ast);
        const expected = '$a:;$b;$;[ and $].[ or a=][] and ';

        assert.strictEqual(actual, expected);
    });

    it('unknown node type', () => {
        assert.throws(
            () => stringify({ type: 'Foo' }),
            /Unknown node type "Foo"/
        );
    });
});
