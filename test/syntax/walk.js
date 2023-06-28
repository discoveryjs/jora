import assert from 'assert';
import jora from 'jora';
import allSyntax from '../helpers/all-syntax.js';

const { syntax: { parse, walk } } = jora;

function dirtyWalk(node, fn) {
    if (!node || !node.type) {
        return;
    }

    fn(node);

    for (const value of Object.values(node)) {
        if (Array.isArray(value)) {
            value.forEach(elem => dirtyWalk(elem, fn));
        } else {
            dirtyWalk(value, fn);
        }
    }
}

describe('syntax/walk', () => {
    it('basic test', () => {
        const { ast } = parse(allSyntax);
        const actual = [];
        const expected = [];

        walk(ast, node => actual.push(node.type));
        dirtyWalk(ast, node => expected.push(node.type));

        assert.deepEqual(actual.sort(), expected.sort());
    });

    it('enter', () => {
        const { ast } = parse(allSyntax);
        const actual = [];
        const expected = [];

        walk(ast, { enter: node => actual.push(node.type) });
        dirtyWalk(ast, node => expected.push(node.type));

        assert.deepEqual(actual.sort(), expected.sort());
    });

    it('leave', () => {
        const { ast } = parse(allSyntax);
        const actual = [];
        const expected = [];

        walk(ast, { leave: node => actual.push(node.type) });
        dirtyWalk(ast, node => expected.push(node.type));

        assert.deepEqual(actual.sort(), expected.sort());
    });

    it('unknown node type', () => {
        assert.throws(
            () => walk({ type: 'Foo' }),
            /Unknown node type "Foo"/
        );
    });
});
