const assert = require('assert');
const data = require('./fixture/simple');
const query = require('../src');

describe('recursive invocation', () => {
    it('should call itself', () => {
        assert.deepEqual(
            query(`
                .({
                    filename,
                    deps: deps.map(::self)
                })
            `)(data[3]),
            (function rec(entry) {
                return {
                    filename: entry.filename,
                    deps: entry.deps.map(rec)
                };
            }(data[3]))
        );
    });

    it('should be callable', () => {
        assert.deepEqual(
            query(`
                .({
                    filename,
                    deps: deps.map(<::self()>)
                })
            `)(data[3]),
            (function rec(entry) {
                return {
                    filename: entry.filename,
                    deps: entry.deps.map(rec)
                };
            }(data[3]))
        );
    });

    it('should take first argument as a new data root', () => {
        const expected = {
            filename: data[3].filename,
            deps: [{
                filename: 'stub',
                deps: []
            }]
        };

        assert.deepEqual(
            query(`
                .({
                    filename,
                    deps: deps.map(<::self({ filename: "stub", deps: () })>)
                })
            `)(data[3]),
            expected
        );

        // alternative syntax
        assert.deepEqual(
            query(`
                .({
                    filename,
                    deps: deps.(::self({ filename: "stub", deps: () }))
                })
            `)(data[3]),
            expected
        );
    });

    it('should preserve context across calls', () => {
        assert.deepEqual(
            query(`
                .({
                    context: #,
                    deps: deps.map(<::self()>)
                })
            `)(data[3], data[1]),
            (function rec(entry) {
                return {
                    context: data[1],
                    deps: entry.deps.map(rec)
                };
            }(data[3]))
        );
    });
});
