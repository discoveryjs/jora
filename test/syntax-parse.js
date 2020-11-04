const assert = require('assert');
const { syntax: { parse } } = require('./helpers/lib');
const allSyntax = require('./helpers/all-syntax');

describe('syntax/parse', () => {
    it('basic test', () => {
        const { ast } = parse(allSyntax);

        assert.deepEqual(ast.type, 'Block');
    });

    describe('errors', () => {
        it('error on unknown token', () => {
            assert.throws(
                () => parse('foo()\n пыщ'),
                function(e) {
                    assert.deepEqual(e.details, {
                        rawMessage: 'Lexical error on line 2. Unrecognized text.\nfoo() пыщ\n------^',
                        text: '',
                        token: null,
                        expected: null,
                        loc: {
                            range: [7, 7],
                            start: {
                                column: 1,
                                line: 2,
                                offset: 7
                            },
                            end: {
                                column: 1,
                                line: 2,
                                offset: 7
                            }
                        }
                    });

                    return /Lexical error on line 2\. Unrecognized text\.\n\nfoo\(\) пыщ\n------\^/.test(e.message);
                }
            );
        });
        it('parse error', () => {
            assert.throws(
                () => parse('foo\n .[bar =]'),
                function(e) {
                    assert.deepEqual(e.details, {
                        rawMessage: "Parse error on line 2:\nfoo .[bar =]\n-----------^\nExpecting '$', 'IDENT', '$IDENT', 'FUNCTION_START', 'FUNCTION', 'NOT', '-', '+', '@', '#', '$$', 'STRING', 'NUMBER', 'REGEXP', 'LITERAL', '[', '(', '.', '.(', '.[', '..', '..(', '{', got ']'",
                        text: ']',
                        token: ']',
                        expected: ["'$'", 'ident', '$ident', "'<'", "'=>'", "'not'", "'-'", "'+'", "'@'", "'#'", "'$$'", 'string', 'number', 'regexp', "'true'", "'false'", "'null'", "'undefined'", "'['", "'('", "'.'", "'.('", "'.['", "'..'", "'..('", "'{'"],
                        loc: {
                            range: [12, 13],
                            start: {
                                column: 8,
                                line: 2,
                                offset: 12
                            },
                            end: {
                                column: 9,
                                line: 2,
                                offset: 13
                            }
                        }
                    });

                    return /Parse error on line 2:\n\nfoo \.\[bar =\]\n-----------\^\n\nExpecting /.test(e.message);
                }
            );
        });
    });
});
