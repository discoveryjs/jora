const assert = require('assert');
const jora = require('../src');

describe('modes', () => {
    describe('strict (default)', () => {
        const options = {};

        it('should return a result data', () => {
            assert.deepEqual(
                jora('foo', options)({ foo: { bar: 42 } }),
                { bar: 42 }
            );
        });

        it('should return a result data (with no options)', () => {
            assert.deepEqual(
                jora('foo')({ foo: { bar: 42 } }),
                { bar: 42 }
            );
        });

        it('should raise an error on query parsing', () => {
            assert.throws(
                () => jora('foo.', options),
                new RegExp('Parse error')
            );
        });

        it('should raise an error on query parsing (with no options)', () => {
            assert.throws(
                () => jora('foo.'),
                new RegExp('Parse error')
            );
        });
    });

    describe('tolerant', () => {
        const options = { tolerant: true };

        it('should return a result data', () => {
            assert.deepEqual(
                jora('foo', options)({ foo: { bar: 42 } }),
                { bar: 42 }
            );
        });

        it('should not raise an error on query parsing', () => {
            assert.doesNotThrow(() => jora('foo.', options));
        });
    });

    describe('stat', () => {
        const options = { stat: true };

        it('should return a stat interface', () => {
            const res = jora('foo', options)({ foo: { bar: 42 } });

            assert.equal(typeof res, 'object');
            assert.equal(typeof res.stat, 'function');
            assert.equal(typeof res.suggestion, 'function');
        });

        it('should raise an error on query parsing', () => {
            assert.throws(
                () => jora('foo.', options),
                new RegExp('Parse error')
            );
        });
    });

    describe('tolerant & stat', () => {
        const options = { tolerant: true, stat: true };

        it('should return a stat interface', () => {
            const res = jora('foo', options)({ foo: { bar: 42 } });

            assert.equal(typeof res, 'object');
            assert.equal(typeof res.stat, 'function');
            assert.equal(typeof res.suggestion, 'function');
            assert.deepEqual(res.stat(2), [{
                context: '',
                current: 'foo',
                from: 0,
                to: 3,
                values: [{
                    foo: {
                        bar: 42
                    }
                }]
            }]);
        });

        it('should not raise an error on query parsing', () => {
            assert.doesNotThrow(() => jora('foo.', options));

            const res = jora('foo.', options)({ foo: { bar: 42 } });
            assert.deepEqual(res.stat(4), [{
                context: '',
                current: '',
                from: 4,
                to: 4,
                values: [{
                    bar: 42
                }]
            }]);
        });
    });
});
