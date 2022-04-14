import assert from 'assert';
import query from 'jora';

describe('syntax/compile', () => {
    it('compilation error', () => {
        assert.throws(
            () => {
                const { ast } = query.syntax.parse('foo()');
                ast.body.method.reference.name = ','; // break
                query.syntax.compile(ast);
            },
            (error) => {
                assert.match(error.compiledSource, /data,context/);
                assert.match(error.details.message, /Unexpected token ','/);
                assert.match(error.stack, /Jora query compilation error/);

                return /Jora query compilation error/.test(error);
            }
        );
    });
});
