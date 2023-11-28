import assert from 'assert';
import jora from 'jora';
import allSyntax from '../helpers/all-syntax.js';

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
                        rawMessage: 'Bad input on line 2 column 1\nfoo()\\n пыщ\n--------^',
                        text: 'п',
                        token: 'BAD_TOKEN',
                        expected: null,
                        loc: {
                            range: [7, 8],
                            start: {
                                column: 1,
                                line: 2,
                                offset: 7
                            },
                            end: {
                                column: 2,
                                line: 2,
                                offset: 8
                            }
                        }
                    });

                    return e.message === e.details.rawMessage.replace(/\n/, '\n\n');
                }
            );
        });
        it('parse error', () => {
            assert.throws(
                () => parse('foo\n .[bar =]'),
                function(e) {
                    assert.deepEqual(e.details, {
                        rawMessage: "Parse error on line 2:\nfoo\\n .[bar =]\n-------------^\nExpecting '$', 'IDENT', '$IDENT', '?', 'FUNCTION', 'NOT', 'NO', '-', '+', 'IS', '@', '#', '$$', 'STRING', 'NUMBER', 'REGEXP', 'LITERAL', '[', '(', '.', '.(', '.[', '..', '..(', '|', 'METHOD(', '$METHOD(', 'TEMPLATE', 'TPL_START', '{', got ']'",
                        text: ']',
                        token: ']',
                        expected: ["'$'", 'ident', '$ident', "'?'",  "'=>'", "'not'", "'no'", "'-'", "'+'", "'is'", "'@'", "'#'", "'$$'", 'string', 'number', 'regexp', "'true'", "'false'", "'null'", "'undefined'", "'NaN'", "'Infinity'", "'['", "'('", "'.'", "'.('", "'.['", "'..'", "'..('", "'|'", "'method('", "'$method('", 'template', "'{'"],
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
