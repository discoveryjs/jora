import assert from 'assert';
import jora from 'jora';

describe('query/debug', () => {
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

    it('should not log by default', () => {
        jora('xyzDebug')({ a: 1, b: 2 });

        assert.deepEqual(buffer, []);
    });

    it('default debug log', () => {
        jora('xyzDebug', { debug: true })({ a: 1, b: 2 });

        assert.deepEqual(buffer.map((item, idx) => idx % 2 ? item.value : item.type), [
            'log',
            '[Compile query from source]',
            'log',
            '[AST]',
            'dir',
            '[Restored source]',
            'log',
            '[Compiled code]',
            'log'
        ]);
    });

    it('stat mode debug log', () => {
        jora('xyzDebug', { debug: true, stat: true })({ a: 1, b: 2 });

        assert.deepEqual(buffer.map((item, idx) => idx % 2 ? item.value : item.type), [
            'log',
            '[Compile query from source]',
            'log',
            '[AST]',
            'dir',
            '[Restored source]',
            'log',
            '[Stat/suggestion ranges]',
            'log',
            '[Compiled code]',
            'log'
        ]);
    });

    it('custom debug handler', () => {
        const buffer = [];
        jora('xyzDebugCustom', {
            debug: (name, value) => buffer.push({ name, value })
        })({ a: 1, b: 2 });

        assert.deepEqual(buffer.map(x => x.name), [
            '=========================',
            'Compile query from source',
            'AST',
            'Restored source',
            'Compiled code'
        ]);
    });
});
