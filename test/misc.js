import assert from 'assert';
import query from 'jora';
import data from './helpers/fixture.js';

describe('query/misc', () => {
    it('can be used with template literals', () => {
        assert.deepEqual(
            query`filename`(data),
            data
                .map(item => item.filename)
        );
    });

    it('expose tokenizer', () => {
        assert.strictEqual(typeof query.syntax.tokenize, 'function');
    });

    if (!query.syntax.parse.bake) {
        it('should not expose generateModule()', () => {
            assert.strictEqual('generateModule' in query.syntax.parse, false);
        });
    }
});
