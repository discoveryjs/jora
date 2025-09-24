export function toNumberLiteral(value) {
    const hex = value.startsWith('0x') || value.startsWith('0X');

    if (value.includes('_')) {
        const errorMatch = value.match(hex
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

    return hex
        ? parseInt(value, 16)
        : parseFloat(value);
}

function isLineTerminator(ch) {
    return ch === '\n' || ch === '\r' || ch === '\u2028' || ch === '\u2029';
}

export function toStringLiteral(value, multiline = false, end = 1) {
    const valueEnd = value.length - end;

    if (!/[\\\r\n\u2028\u2029]/.test(value)) {
        return value.slice(1, valueEnd);
    }

    let result = '';

    for (let i = 1; i < valueEnd; i++) {
        const ch = value[i];

        if (!multiline && isLineTerminator(ch)) {
            throw new Error('Invalid line terminator');
        }

        if (ch !== '\\') {
            result += ch;
            continue;
        }

        if (i === valueEnd - 1) {
            throw new Error('Invalid backslash');
        }

        const next = value[++i];
        switch (next) {
            case '\r':
                // ignore line terminator
                i += value[i + 1] === '\n';  // \r\n
                break;

            case '\n':
            case '\u2028':
            case '\u2029':
                // ignore line terminator
                break;

            case '0': result += '\0'; break;
            case 'b': result += '\b'; break;
            case 'n': result += '\n'; break;
            case 'r': result += '\r'; break;
            case 'f': result += '\f'; break;
            case 't': result += '\t'; break;
            case 'v': result += '\v'; break;

            case 'u': {
                const [hex = ''] = value.slice(i + 1, i + 5).match(/^[0-9a-f]*/i) || [];

                if (hex.length === 4) {
                    result += String.fromCharCode(parseInt(hex, 16));
                    i += 4;
                    break;
                }

                throw new Error('Invalid Unicode escape sequence');
            }

            case 'x': {
                const [hex = ''] = value.slice(i + 1, i + 3).match(/^[0-9a-f]*/i) || [];

                if (hex.length === 2) {
                    result += String.fromCharCode(parseInt(hex, 16));
                    i += 2;
                    break;
                }

                throw new Error('Invalid hexadecimal escape sequence');
            }

            default:
                result += next;
        }
    }

    return result;
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
