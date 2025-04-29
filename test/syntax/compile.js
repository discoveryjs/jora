import assert from 'assert';
import jora from 'jora';

const { syntax: { parse, compile } } = jora;
const match = assert.match || ((str, rx) => assert(rx.test(str), `${str} doesn't match to ${rx}`));

describe('syntax/compile', () => {
    it('compilation error', () => {
        assert.throws(
            () => {
                const { ast } = parse('$test;');
                ast.definitions[0].declarator.name = ''; // break AST for a compilation error simulation
                compile(ast);
            },
            (error) => {
                match(error.compiledSource, /data,context/);
                match(error.details.message, /Unexpected token ('?)=\1/);
                match(error.stack, /Jora query compilation error/);

                return /Jora query compilation error/.test(error);
            }
        );
    });

    it('unknown node type', () => {
        assert.throws(
            () => compile({ type: 'Foo' }),
            /Unknown node type "Foo"/
        );
    });
});
