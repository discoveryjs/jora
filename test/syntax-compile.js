import assert from 'assert';
import query from 'jora';

const match = assert.match || ((str, rx) => assert(rx.test(str)));

describe('syntax/compile', () => {
    it('compilation error', () => {
        assert.throws(
            () => {
                const { ast } = query.syntax.parse('foo()');
                ast.body.method.reference.name = ','; // break
                query.syntax.compile(ast);
            },
            (error) => {
                match(error.compiledSource, /data,context/);
                match(error.details.message, /Unexpected token ','/);
                match(error.stack, /Jora query compilation error/);

                return /Jora query compilation error/.test(error);
            }
        );
    });
});
