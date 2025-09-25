export function toNumberLiteral(value) {
    const isHex = value.startsWith('0x') || value.startsWith('0X');

    if (value.includes('_')) {
        const errorMatch = value.match(isHex
            ? /(?:^|[^0-9a-fA-F])_|_(?:[^0-9a-fA-F]|$)/
            : /(?:^|\D)_|_(?:\D|$)/
        );

        if (errorMatch) {
            const m = errorMatch[0];
            const message = m === '__'
                ? 'Only one underscore is allowed'
                : 'Wrong underscore';

            throw new Error(`${message} as numeric separator`);
        }

        value = value.replace(/_/g, '');
    }

    return isHex
        ? parseInt(value, 16)
        : parseFloat(value);
}

const ESCAPE_REPLACE = {
    '0': '\0',
    'b': '\b',
    'n': '\n',
    'r': '\r',
    'f': '\f',
    't': '\t',
    'v': '\v'
};

export function toStringLiteral(value, multiline = false, end = 1) {
    return value
        .slice(1, value.length - end)
        .replace(/\\(?:(\r\n?|\n|\u2028|\u2029)|([xu][0-9a-fA-F]*)|$|(.))|[\r\n\u2028\u2029]/g, (match, lineTerminator, escapeHex, other) => {
            // Handle escaped line terminators
            if (lineTerminator) {
                return '';  // ignore escaped line terminators
            }

            // Handle unicode/hex escapes
            if (escapeHex) {
                const isUnicode = escapeHex[0] === 'u';

                if (escapeHex.length === (isUnicode ? 5 : 3)) {
                    return String.fromCharCode(parseInt(escapeHex.slice(1), 16));
                }

                throw new Error(`Invalid ${isUnicode ? 'Unicode' : 'hexadecimal'} escape sequence`);
            }

            // Handle backslash at end
            if (match === '\\') {
                throw new Error('Invalid backslash');
            }

            // Handle other escaped characters
            if (other) {
                return ESCAPE_REPLACE[other] || other;
            }

            // Handle unescaped line terminators
            if (!multiline && /[\r\n\u2028\u2029]/.test(match)) {
                throw new Error('Invalid line terminator');
            }

            return match; // unescaped line terminator in multiline mode
        });
}

export function toRegExpLiteral(value) {
    const flags = value.match(/[^/]*$/)[0];

    for (let i = 0; i < flags.length; i++) {
        if (flags.includes(flags[i], i + 1)) {
            throw new Error('Duplicate flag in regexp');
        }
    }

    return new RegExp(value.slice(1, -flags.length - 1), flags);
}
