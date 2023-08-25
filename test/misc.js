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

describe('method info helpers', () => {
    it('createMethodInfo', () => {
        assert.deepEqual(query.createMethodInfo([], 'some return type', {description: 'some description'}), {
            args: [],
            description: 'some description',
            returns: 'some return type'
        });
    });

    it('createMethodInfoArg', () => {
        assert.deepEqual(query.createMethodInfoArg('arg1', 'some arg type', {description: 'some description'}), {
            name: 'arg1',
            description: 'some description',
            options: {
                defaultValue: undefined,
                isOptional: false
            },
            type: 'some arg type'
        });

        assert.deepEqual(query.createMethodInfoArg('arg1', 'some arg type', {description: 'some description', defaultValue: '123'}), {
            name: 'arg1',
            description: 'some description',
            options: {
                defaultValue: '123',
                isOptional: true
            },
            type: 'some arg type'
        });
    });
});
