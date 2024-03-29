import assert from 'assert';
import query from 'jora';

const keywords = [
    true,
    false,
    null,
    undefined,
    Infinity,
    NaN
];

describe('lang/literals', () => {
    keywords.forEach(keyword => {
        describe(String(keyword), () => {
            it('basic', () =>
                assert.ok(
                    Object.is(query(String(keyword))({ [keyword]: 42 }), keyword)
                )
            );

            it('white space surrounded', () =>
                assert.ok(
                    Object.is(query(' ' + keyword + ' ')({ [keyword]: 42 }), keyword)
                )
            );

            it('should not treat prefixed keyword as a keyword', () =>
                assert.strictEqual(
                    query('x' + keyword)({ ['x' + keyword]: 42 }),
                    42
                )
            );

            it('should not treat postfixed keyword as a keyword', () =>
                assert.strictEqual(
                    query(keyword + 'x')({ [keyword + 'x']: 42 }),
                    42
                )
            );
        });
    });
});
