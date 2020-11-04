const assert = require('assert');
const { syntax: { parse, stringify } } = require('./helpers/lib');
const allSyntax = require('./helpers/all-syntax');

describe('syntax/stringify', () => {
    it('basic test', () => {
        const actual = stringify(parse(allSyntax).ast);

        assert.equal(actual, allSyntax);
    });
});
