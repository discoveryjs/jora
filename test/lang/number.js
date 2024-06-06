import assert from 'assert';
import query from 'jora';

const signs = Object.entries({
    '': 'no sign',
    '+': 'positive',
    '-': 'negative'
});

describe('lang/number', () => {
    describe('decimal', () => {
        const numbers = [
            '0',
            '123',
            '12_3',
            '123.456',
            '12_3.456',
            '123.4_56',
            '1_2_3.4_5_6',
            '.456',
            '.4_5_6',
            '1e3',
            '1E3',
            '1.2e3',
            '.3e3',
            '1e+3',
            '123E+3',
            '1_2_3E+0_3',
            '1.5e+3',
            '1_2.5_6e+3_4',
            '.5e+3',
            '5e-1',
            '523E-1',
            '2_3E-1_2',
            '1.5e-2',
            '.5e-3'
        ];

        for (const [prefix, name] of signs) {
            describe(name, () => numbers.forEach(value =>
                it(prefix + value, () =>
                    assert.strictEqual(
                        query(prefix + value)(),
                        Number(prefix + value.replace(/_/g, ''))
                    )
                )
            ));
        }
    });

    describe('hexadecimal', () => {
        const numbers = [
            '0x0',
            '0x12345678',
            '0x1234_5678',
            '0xabcdef',
            '0xabcd_ef',
            '0xABCDEF',
            '0xABC_DEF',
            '0x123abc',
            '0x123_abc',
            '0xabc123',
            '0X123abc',
            '0Xabc123',
            '0x123ABC',
            '0xABC123',
            '0xC0FfEe',
            '0xC_0_F_f_E_e'
        ];

        for (const [prefix, name] of signs) {
            describe(name, () => numbers.forEach(value =>
                it(prefix + value, () =>
                    assert.strictEqual(
                        query(prefix + value)(),
                        parseInt(prefix + value.replace(/_/g, ''), 16)
                    )
                )
            ));
        }
    });

    describe('underscore in numbers edge cases', () => {
        const badNumbers = [
            // '_123', // Not an error since treated as indent
            { value: '1__2', pos: 2 },
            { value: '1___3', pos: 2 },
            { value: '123_', pos: 3 },
            { value: '123_.123', pos: 3 },
            { value: '123._123', pos: 4 },
            { value: '.1_2_', pos: 4 },
            { value: '._1_2', pos: 1 },
            { value: '2e-_1_2', pos: 3 },
            { value: '0x1__2', pos: 4 },
            { value: '0x_ab', pos: 2 },
            { value: '0xab_', pos: 4 }
        ];

        for (const [prefix, name] of signs) {
            describe(name, () => badNumbers.forEach(({ value, pos }) =>
                it(prefix + value, () =>
                    assert.throws(
                        () => query(prefix + value)(),
                        new RegExp(`SyntaxError: .+? as numeric separator\\n\\n${(prefix ? '\\' : '') + prefix + value.replace(/\./g, '\\.')}\\n${'-'.repeat(pos + prefix.length)}\\^`)
                    )
                )
            ));
        }
    });
});
