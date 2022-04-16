import assert from 'assert';
import query from 'jora';

const match = assert.match || ((str, rx) => assert(rx.test(str), `${str} doesn't match to ${rx}`));

describe('syntax/compile', () => {
    it('compilation error', () => {
        assert.throws(
            () => {
                const { ast } = query.syntax.parse('foo()');
                ast.body.method.reference.name = ','; // break AST for a compilation error simulation
                query.syntax.compile(ast);
            },
            (error) => {
                match(error.compiledSource, /data,context/);
                match(error.details.message, /Unexpected token ('?),\1/);
                match(error.stack, /Jora query compilation error/);

                return /Jora query compilation error/.test(error);
            }
        );
    });
});
