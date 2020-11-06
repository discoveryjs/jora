const assert = require('assert');
const query = require('./helpers/lib');
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
            '123.456',
            '.456',
            '1e3',
            '1E3',
            '1.2e3',
            '.3e3',
            '1e+3',
            '123E+3',
            '1.5e+3',
            '.5e+3',
            '5e-1',
            '523E-1',
            '1.5e-2',
            '.5e-3'
        ];

        for (const [prefix, name] of signs) {
            describe(name, () => numbers.forEach(value =>
                it(prefix + value, () =>
                    assert.strictEqual(
                        query(prefix + value)(),
                        Number(prefix + value)
                    )
                )
            ));
        }
    });

    describe('hexadecimal', () => {
        const numbers = [
            '0x0',
            '0x12345678',
            '0xabcdef',
            '0xABCDEF',
            '0x123abc',
            '0xabc123',
            '0X123abc',
            '0Xabc123',
            '0x123ABC',
            '0xABC123',
            '0xC0FfEe'
        ];

        for (const [prefix, name] of signs) {
            describe(name, () => numbers.forEach(value =>
                it(prefix + value, () =>
                    assert.strictEqual(
                        query(prefix + value)(),
                        parseInt(prefix + value, 16)
                    )
                )
            ));
        }
    });
});
