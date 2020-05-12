const assert = require('assert');
const { syntax: { parse, walk } } = require('./helpers/lib');
const allSyntax = require('./helpers/all-syntax');

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

describe('walk', () => {
    it('basic test', () => {
        const { ast } = parse(allSyntax);
        const actual = [];
        const expected = [];

        walk(ast, node => actual.push(node.type));
        dirtyWalk(ast, node => expected.push(node.type));

        assert.deepEqual(actual.sort(), expected.sort());
    });
});