import assert from 'assert';
import query from 'jora';

const valid = [
    '""',
    '"string"',
    '"str\\"\\\'\'\\``ing"',
    '"\\u0020\\U0020"',
    '"\\x20\\X20"',
    '"\\\\"',
    '"\\\\"+"\\\\"',
    '"\\\\\\b\\f\\n\\r\\t\\v\\0"',
    '"asd\\\n\\\r\\\r\n\\\u2028\\\u2029zxc"',
    "''",
    "'string'",
    "'str\\'\\\"\"\\``ing'",
    "'\\u0020\\U0020'",
    "'\\x20\\X20'",
    "'\\\\'",
    "'\\\\'+'\\\\'",
    "'\\\\\\b\\f\\n\\r\\t\\v\\0'",
    "'asd\\\n\\\r\\\r\n\\\u2028\\\u2029zxc'"
];

const invalid = {
    "' \\u'": 'Invalid Unicode escape sequence',
    "' \\ux'": 'Invalid Unicode escape sequence',
    "' \\u0x'": 'Invalid Unicode escape sequence',
    "' \\u00x'": 'Invalid Unicode escape sequence',
    "' \\u000x'": 'Invalid Unicode escape sequence',
    '" \\u"': 'Invalid Unicode escape sequence',
    '" \\ux"': 'Invalid Unicode escape sequence',
    '" \\u0x"': 'Invalid Unicode escape sequence',
    '" \\u00x"': 'Invalid Unicode escape sequence',
    '" \\u000x"': 'Invalid Unicode escape sequence',
    '" \\x"': 'Invalid hexadecimal escape sequence',
    '" \\xx"': 'Invalid hexadecimal escape sequence',
    '" \\x0x"': 'Invalid hexadecimal escape sequence',
    "' \\x'": 'Invalid hexadecimal escape sequence',
    "' \\xx'": 'Invalid hexadecimal escape sequence',
    "' \\x0x'": 'Invalid hexadecimal escape sequence',
    '" \n"': 'Invalid line terminator',
    '" \r"': 'Invalid line terminator',
    '" \u2028"': 'Invalid line terminator',
    '" \u2029"': 'Invalid line terminator',
    "' \n'": 'Invalid line terminator',
    "' \r'": 'Invalid line terminator',
    "' \u2028'": 'Invalid line terminator',
    "' \u2029'": 'Invalid line terminator',
    '" \\"': 'Invalid backslash',
    "' \\'": 'Invalid backslash'
};

describe('lang/string', () => {
    describe('valid', () => valid.forEach(value =>
        it(value, () =>
            assert.strictEqual(
                query(value)(),
                new Function('return ' + value)()
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
});
