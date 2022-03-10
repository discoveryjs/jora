import assert from 'assert';
import jora from 'jora';
import data from './helpers/fixture.js';

describe('query/method extensions', () => {
    function createExtraFn() {
        const calls = [];
        return {
            calls,
            query: jora.setup({
                log() {
                    calls.push([...arguments]);
                }
            })
        };
    }

    it('should be called', () => {
        const extra = createExtraFn();

        extra.query('log()')(data);
        assert.deepEqual(
            extra.calls,
            [[data]]
        );
    });

    it('should be called when started with dot', () => {
        const extra = createExtraFn();

        extra.query('.log()')(data);
        assert.deepEqual(
            extra.calls,
            [[data]]
        );
    });

    it('should be called with precending query', () => {
        const extra = createExtraFn();

        extra.query('filename.log()')(data);
        assert.deepEqual(
            extra.calls,
            [[data.map(item => item.filename)]]
        );
    });

    it('should be called for each item when using in parentheses', () => {
        const extra = createExtraFn();

        extra.query('filename.(log())')(data);
        assert.deepEqual(
            extra.calls,
            data.map(item => [item.filename])
        );
    });

    it('should accept params', () => {
        const extra = createExtraFn();

        extra.query('.[filename="1.css"].(log(1, 2, 3))')(data);
        assert.deepEqual(
            extra.calls,
            [[data[0], 1, 2, 3]]
        );
    });

    it('should resolve params to current', () => {
        const extra = createExtraFn();

        extra.query('.log(filename)')(data);
        assert.deepEqual(
            extra.calls,
            [[data, data.map(item => item.filename)]]
        );
    });

    it('should resolve params to current inside a parentheses', () => {
        const extra = createExtraFn();

        extra.query('.(log(filename))')(data);
        assert.deepEqual(
            extra.calls,
            data.map(item => [item, item.filename])
        );
    });

    it('should not call a method in map when undefined on object path', () => {
        const extra = createExtraFn();

        extra.query('dontexists.(log())')({});
        assert.deepEqual(
            extra.calls,
            []
        );
    });

    it('scope for method arguments should be the same as for query root', () => {
        const extra = createExtraFn();
        const data = { foo: { bar: 42 }, baz: 43 };

        extra.query('foo.bar.log($, baz)')(data);
        assert.deepEqual(
            extra.calls,
            [[42, data, 43]]
        );
    });

    it('scope for method arguments should be the same as for query root (issue #1)', () => {
        const extra = createExtraFn();

        extra.query('#.foo.log(bar)')({ bar: 43 }, { foo: 42 });
        assert.deepEqual(
            extra.calls,
            [[42, 43]]
        );
    });
});
