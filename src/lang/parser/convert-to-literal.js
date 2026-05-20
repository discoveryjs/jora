export function toNumberLiteral(value, throwError) {
    const isHex = value.startsWith('0x') || value.startsWith('0X');

    if (value.includes('_')) {
        const errorMatch = value.match(isHex
            ? /(?:^|[^0-9a-fA-F])_|_(?:[^0-9a-fA-F]|$)/
            : /(?:^|\D)_|_(?:\D|$)/
        );

        if (errorMatch) {
            const m = errorMatch[0];
            const index = errorMatch.index + Number(m[1] === '_');
            const message = m === '__'
                ? 'Only one underscore is allowed'
                : 'Wrong underscore';

            throwError(
                `${message} as numeric separator`,
                { inside: [index, 1] }
            );
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

export function toStringLiteral(value, multiline = false, end = 1, throwError) {
    return value
        .slice(1, value.length - end)
        .replace(/\\(?:(\r\n?|\n|\u2028|\u2029)|([xu][0-9a-fA-F]*)|$|(.))|[\r\n\u2028\u2029]/g, (match, lineTerminator, escapeHex, other, offset) => {
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

                throwError(
                    `Invalid ${isUnicode ? 'Unicode' : 'hexadecimal'} escape sequence`,
                    { inside: [offset + 1, match.length] }
                );
            }

            // Handle backslash at end
            if (match === '\\') {
                throwError('Invalid backslash',
                    { inside: [offset + 1, 1] }
                );
            }

            // Handle other escaped characters
            if (other) {
                return ESCAPE_REPLACE[other] || other;
            }

            // Handle unescaped line terminators
            if (!multiline && /[\r\n\u2028\u2029]/.test(match)) {
                throwError(
                    'Invalid line terminator',
                    { inside: [offset + 1, 1] }
                );
            }

            return match; // unescaped line terminator in multiline mode
        });
}

export function toRegExpLiteral(value, throwError) {
    const flagsMatch = value.match(/[^/]*$/) || { index: value.length };

    for (let i = flagsMatch.index; i < value.length; i++) {
        const duplicateIndex = value.indexOf(value[i], i + 1);
        if (duplicateIndex !== -1) {
            throwError(
                'Duplicate flag in regexp',
                { inside: [duplicateIndex, 1] }
            );
        }
    }

    return new RegExp(
        value.slice(1, flagsMatch.index - 1),
        value.slice(flagsMatch.index)
    );
}
