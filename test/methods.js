const assert = require('assert');
const data = require('./fixture/simple');
const query = require('./helpers/lib');

describe('method', () => {
    function createExtraFn() {
        const calls = [];
        return {
            calls,
            methods: {
                log() {
                    calls.push([...arguments]);
                }
            }
        };
    }

    it('should be called', () => {
        const extra = createExtraFn();

        query('log()', extra)(data);
        assert.deepEqual(
            extra.calls,
            [[data]]
        );
    });

    it('should be called when started with dot', () => {
        const extra = createExtraFn();

        query('.log()', extra)(data);
        assert.deepEqual(
            extra.calls,
            [[data]]
        );
    });

    it('should be called with precending query', () => {
        const extra = createExtraFn();

        query('filename.log()', extra)(data);
        assert.deepEqual(
            extra.calls,
            [[data.map(item => item.filename)]]
        );
    });

    it('should be called for each item when using in parentheses', () => {
        const extra = createExtraFn();

        query('filename.(log())', extra)(data);
        assert.deepEqual(
            extra.calls,
            data.map(item => [item.filename])
        );
    });

    it('should accept params', () => {
        const extra = createExtraFn();

        query('.[filename="1.css"].(log(1, 2, 3))', extra)(data);
        assert.deepEqual(
            extra.calls,
            [[data[0], 1, 2, 3]]
        );
    });

    it('should resolve params to current', () => {
        const extra = createExtraFn();

        query('.log(filename)', extra)(data);
        assert.deepEqual(
            extra.calls,
            [[data, data.map(item => item.filename)]]
        );
    });

    it('should resolve params to current inside a parentheses', () => {
        const extra = createExtraFn();

        query('.(log(filename))', extra)(data);
        assert.deepEqual(
            extra.calls,
            data.map(item => [item, item.filename])
        );
    });

    it('should not call a method in map when undefined on object path', () => {
        const extra = createExtraFn();

        query('dontexists.(log())', extra)({});
        assert.deepEqual(
            extra.calls,
            []
        );
    });

    it('scope for method arguments should be the same as for query root', () => {
        const extra = createExtraFn();
        const data = { foo: { bar: 42 }, baz: 43 };

        query('foo.bar.log($, baz)', extra)(data);
        assert.deepEqual(
            extra.calls,
            [[42, data, 43]]
        );
    });

    it('scope for method arguments should be the same as for query root (issue #1)', () => {
        const extra = createExtraFn();

        query('#.foo.log(bar)', extra)({ bar: 43 }, { foo: 42 });
        assert.deepEqual(
            extra.calls,
            [[42, 43]]
        );
    });
});
