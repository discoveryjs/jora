import assert from 'assert';
import query from 'jora';

const valid = [
    '``',
    '`template`',
    '`temp\\""\\\'\'\\`late`',
    '`\\u0020\\U0020`',
    '`\\\\`',
    '`\\\\`+`\\\\`',
    '`\\x20\\X20`',
    '`\\\\\\b\\f\\n\\r\\t\\v\\0`',
    '`escaped\\\n\\\r\\\r\n\\\u2028\\\u2029newlines`',
    '`asd\\${_}-\\${_}asd`',
    '`asd\\\\${_}-\\\\${_}asd`',
    '`asd\\\\\\${_}-\\\\\\${_}asd`',
    '`asd$\\{_}-$\\{_}asd`',
    '`${_}`',
    '`pre${_}`',
    '`${_}post`',
    '`${_}mid${_}`',
    '`pre${_}post`',
    '`pre${_}mid${_}post`',
    '`asd${{a:`1${43}3`}.a-33 or 123}a${1?`z${42}z`:2}sd`',
    '`${}`',
    '`asd${}asd`',
    '`${}asd${}asd${}`'
];

const invalid = {
    '` \\u`': 'Invalid Unicode escape sequence',
    '` \\ux`': 'Invalid Unicode escape sequence',
    '` \\u0x`': 'Invalid Unicode escape sequence',
    '` \\u00x`': 'Invalid Unicode escape sequence',
    '` \\u000x`': 'Invalid Unicode escape sequence',
    '` \\x`': 'Invalid hexadecimal escape sequence',
    '` \\xx`': 'Invalid hexadecimal escape sequence',
    '` \\x0x`': 'Invalid hexadecimal escape sequence'
};

describe('lang/template', () => {
    it('newlines', () =>
        assert.strictEqual(
            query('`new\n\r\r\n\u2028\u2029lines`')(),
            'new\n\r\r\n\u2028\u2029lines'
        )
    );
    describe('valid', () => valid.forEach(value =>
        it(value, () =>
            assert.strictEqual(
                query(value)({ _: '_' }),
                new Function('_="_"', 'return ' + value.replace(/ or /g, '||').replace(/\$\{\}/g, '${""}'))()
            )
        )
    ));

    describe('invalid', () => Object.entries(invalid).forEach(([value, message]) =>
        it(value, () =>
            assert.throws(
                () => query(value),
                (e) => {
                    assert.strictEqual(e.message.split(/\n/)[0], message);
                    assert.strictEqual(e.details.loc.range[0], 2);
                    return true;
                }
            )
        )
    ));

    describe('with division operator/regexp', () => {
        [
            ['`444`/2/2', 111],
            ['`4${4}4`/2/2', 111],
            ['`4${/4/}4`', '4/4/4'],
            ['`4${/2/}4${/2/}4`', '4/2/4/2/4']
        ].forEach(([test, expected]) =>
            it(test, () =>
                assert.strictEqual(
                    query(test)(),
                    expected
                )
            )
        );
    });
});
