const assert = require('assert');
const jora = require('./helpers/lib');

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

    describe('debug', () => {
        const log = console.log;
        const dir = console.dir;
        let buffer;

        beforeEach(() => {
            buffer = [];
            console.log = value => value !== undefined && buffer.push({ type: 'log', value });
            console.dir = value => value !== undefined && buffer.push({ type: 'dir', value });
        });
        afterEach(() => {
            console.log = log;
            console.dir = dir;
        });

        it('should log', () => {
            jora('xyzDebug', { debug: true })({ a: 1, b: 2 });

            assert.deepEqual(buffer.map((item, idx) => idx % 2 ? item.value : item.type), [
                'log',
                '[Compile query from source]',
                'log',
                '[AST]',
                'dir',
                '[Restored source]',
                'log',
                '[Suggest ranges]',
                'log',
                '[Function]',
                'log'
            ]);
        });

        it('should log', () => {
            const buffer = [];
            jora('xyzDebugCustom', {
                debug: (name, value) => buffer.push({ name, value })
            })({ a: 1, b: 2 });

            assert.deepEqual(buffer.map(x => x.name), [
                '=========================',
                'Compile query from source',
                'AST',
                'Restored source',
                'Suggest ranges',
                'Function'
            ]);
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
                context: 'path',
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
                context: 'path',
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
