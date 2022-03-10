import assert from 'assert';
import jora from 'jora';
import allSyntax from './helpers/all-syntax.js';

const { syntax: { parse } } = jora;

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
                        rawMessage: 'Lexical error on line 2. Unrecognized text.\nfoo()\\n пыщ\n--------^',
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

                    return /Lexical error on line 2\. Unrecognized text\.\n\nfoo\(\)\\n пыщ\n--------\^/.test(e.message);
                }
            );
        });
        it('parse error', () => {
            assert.throws(
                () => parse('foo\n .[bar =]'),
                function(e) {
                    assert.deepEqual(e.details, {
                        rawMessage: "Parse error on line 2:\nfoo\\n .[bar =]\n-------------^\nExpecting '$', 'IDENT', '$IDENT', 'FUNCTION_START', 'FUNCTION', 'NOT', '-', '+', '@', '#', '$$', 'STRING', 'NUMBER', 'REGEXP', 'LITERAL', '[', '(', '.', '.(', '.[', '..', '..(', 'TEMPLATE', 'TPL_START', '{', got ']'",
                        text: ']',
                        token: ']',
                        expected: ["'$'", 'ident', '$ident', "'<'", "'=>'", "'not'", "'-'", "'+'", "'@'", "'#'", "'$$'", 'string', 'number', 'regexp', "'true'", "'false'", "'null'", "'undefined'", "'['", "'('", "'.'", "'.('", "'.['", "'..'", "'..('", 'template', "'{'"],
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

                    return /Parse error on line 2:\n\nfoo\\n \.\[bar =\]\n-------------\^\n\nExpecting /.test(e.message);
                }
            );
        });
    });
});
