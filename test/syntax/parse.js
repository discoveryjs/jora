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
                        rawMessage: 'Bad input on line 2 column 1',
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
                    assert.strictEqual(
                        e.message,
                        e.details.rawMessage + '\n\nfoo()\\n пыщ\n--------^'
                    );

                    return true;
                }
            );
        });
        it('parse error', () => {
            assert.throws(
                () => parse('foo\n .[bar =]'),
                function(e) {
                    assert.deepEqual(e.details, {
                        rawMessage:
                            // FIXME: The legacy parser reports "Parse error ..."
                            e.details.rawMessage === 'Expected expression'
                                ? 'Expected expression'
                                : "Parse error on line 2:\nfoo\\n .[bar =]\n-------------^\nExpecting '$', 'IDENT', '$IDENT', '?', '=>', '(', 'NOT', 'NO', '-', '+', '|', 'IS', '@', '#', '$$', 'STRING', 'NUMBER', 'REGEXP', 'LITERAL', '[', '.', '.(', '.[', '..', '..(', 'METHOD(', '$METHOD(', 'TEMPLATE', 'TPL_START', '{', got ']'",
                        text: ']',
                        token: ']',
                        // FIXME: The legacy parser reports expected tokens
                        expected: e.details.expected && ["'$'", 'ident', '$ident', "'?'",  "'=>'", "'('", "'not'", "'no'", "'-'", "'+'", "'|'", "'is'", "'@'", "'#'", "'$$'", 'string', 'number', 'regexp', "'true'", "'false'", "'null'", "'undefined'", "'NaN'", "'Infinity'", "'['", "'.'", "'.('", "'.['", "'..'", "'..('", "'method('", "'$method('", 'template', "'{'"],
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
                    assert.match(
                        e.message,
                        /Parse error on line 2:\n\nfoo\\n \.\[bar =\]\n-------------\^\n\nExpect/
                    );

                    return true;
                }
            );
        });
    });
});
