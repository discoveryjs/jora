const TYPE_EOF = 0;
const TYPE_WS = 1;
const TYPE_DELIM = 2;
const TYPE_NUM = 3;
const TYPE_WORD = 4;
const T = ['eof', 'ws', 'delim', 'number', 'word'];
let debug = false;

const safeCharCodeAt = (source, offset) => offset < source.length ? source.charCodeAt(offset) : 0;
const isSign = (code) => code === 0x002B || code === 0x002D;
const isDigit = (code) => code >= 0x0030 && code <= 0x0039;
const isWS = (code) => (
    code === 0x0009 ||  // \t
    code === 0x000A ||  // \n
    code === 0x000C ||  // \f
    code === 0x000D ||  // \r
    code === 0x0020     // whitespace
);
const isDelim = (code) => (
    (code > 0x0020 && code < 0x0100) &&  // ascii char
    (code < 0x0041 || code > 0x005A) &&  // not A..Z
    (code < 0x0061 || code > 0x007A) &&  // not a..z
    (code < 0x0030 || code > 0x0039) &&  // not 0..9
    code !== 0x002B &&                   // not +
    code !== 0x002D                      // not -
) || code === 0x2116;  /* № */

//  Check if three code points would start a number
function isNumberStart(first, second, third) {
    // Look at the first code point:

    // U+002B PLUS SIGN (+)
    // U+002D HYPHEN-MINUS (-)
    if (isSign(first)) {
        // If the second code point is a digit, return true.
        if (isDigit(second)) {
            return 2;
        }

        // Otherwise, if the second code point is a U+002E FULL STOP (.)
        // and the third code point is a digit, return true.
        // Otherwise, return false.
        return second === 0x002E && isDigit(third) ? 3 : 0;
    }

    // U+002E FULL STOP (.)
    // if (first === 0x002E) {
    //     // If the second code point is a digit, return true. Otherwise, return false.
    //     return isDigit(second) ? 2 : 0;
    // }

    // digit
    if (isDigit(first)) {
        // Return true.
        return 1;
    }

    // anything else
    // Return false.
    return 0;
}

function findDecimalNumberEnd(source, offset) {
    while (isDigit(safeCharCodeAt(source, offset))) {
        offset++;
    }

    return offset;
}

function consumeNumber(source, offset, preventFloat) {
    let code = safeCharCodeAt(source, offset);

    // If the next input code point is U+002B PLUS SIGN (+) or U+002D HYPHEN-MINUS (-),
    // consume it and append it to repr.
    if (isSign(code)) {
        code = safeCharCodeAt(source, offset += 1);
    }

    // While the next input code point is a digit, consume it and append it to repr.
    if (isDigit(code)) {
        offset = findDecimalNumberEnd(source, offset + 1);
        code = safeCharCodeAt(source, offset);
    }

    // If the next 2 input code points are U+002E FULL STOP (.) followed by a digit, then:
    if (code === 0x002E && isDigit(safeCharCodeAt(source, offset + 1))) {
        if (preventFloat) {
            return offset;
        }

        // Consume them
        let expectedEnd = offset + 2;

        // While the next input code point is a digit, consume it and append it to repr.
        expectedEnd = findDecimalNumberEnd(source, expectedEnd);

        // If next char is U+002E FULL STOP (.), then don't consume
        if (safeCharCodeAt(source, expectedEnd) === 0x002E) {
            return offset;
        }

        offset = expectedEnd;
    }

    // If the next 2 or 3 input code points are U+0045 LATIN CAPITAL LETTER E (E)
    // or U+0065 LATIN SMALL LETTER E (e), ... , followed by a digit, then:
    code = safeCharCodeAt(source, offset);
    if (code === 0x0045 /* e */ || code === 0x0065 /* E */) {
        let sign = 0;
        code = safeCharCodeAt(source, offset + 1);

        // ... optionally followed by U+002D HYPHEN-MINUS (-) or U+002B PLUS SIGN (+) ...
        if (isSign(code)) {
            sign = 1;
            code = safeCharCodeAt(source, offset + 2);
        }

        // ... followed by a digit
        if (isDigit(code)) {
            // While the next input code point is a digit, consume it and append it to repr.
            offset = findDecimalNumberEnd(source, offset + 1 + sign + 1);
        }
    }

    return offset;
}

function getPart(source, offset, preventFloat, preventSign) {
    if (offset >= source.length) {
        return TYPE_EOF;
    }

    let a = safeCharCodeAt(source, offset);

    // Whitespace
    if (isWS(a)) {
        let end = offset + 1;

        while (isWS(safeCharCodeAt(source, end))) {
            end++;
        }

        return TYPE_WS | (end - offset << 3);
    }

    // Delim sequence
    // console.log(source[offset], isDelim(a), a.toString(16), preventSign)
    if (isDelim(a) || (preventSign && isSign(a))) {
        let end = offset + 1;
        let b = a;

        do {
            a = b;
            b = safeCharCodeAt(source, end++);
        } while (isDelim(b) || b === a);

        return TYPE_DELIM | (end - offset - 1 << 3);
    }

    // Number
    let b = safeCharCodeAt(source, offset + 1);
    let c = safeCharCodeAt(source, offset + 2);
    if (isNumberStart(a, b, c)) {
        return TYPE_NUM | (consumeNumber(source, offset, preventFloat) - offset << 3);
    }

    // Word
    let end = offset;
    do {
        a = b;
        b = c;
        c = safeCharCodeAt(source, 3 + end++);
    } while (end < source.length && !isWS(a) && !isDelim(a) && !isDigit(a));

    return TYPE_WORD | (end - offset << 3);
}

function compare(a, b, analytical) {
    let offsetA = 0;
    let offsetB = 0;
    let preventFloat = false;
    let preventSign = false;
    let postCmpResult = 0;
    let postCmpResultType = 0;
    let firstPart = true;

    do {
        const partA = getPart(a, offsetA, preventFloat, preventSign);
        const partB = getPart(b, offsetB, preventFloat, preventSign);
        const typeA = partA & 7;
        const lenA = partA >> 3;
        const typeB = partB & 7;
        const lenB = partB >> 3;

        if (debug) {
            console.log({
                typeA: T[typeA], lenA, substrA: a.substr(offsetA, lenA),
                typeB: T[typeB], lenB, substrB: b.substr(offsetB, lenB)
            });
        }

        if (typeA !== typeB && firstPart) {
            if ((typeA === TYPE_WS || typeA === TYPE_DELIM) && (typeB === TYPE_NUM || typeB === TYPE_WORD)) {
                postCmpResult = 1;
                postCmpResultType = typeA;
                offsetA += lenA;
                continue;
            }

            if ((typeB === TYPE_WS || typeB === TYPE_DELIM) && (typeA === TYPE_NUM || typeA === TYPE_WORD)) {
                postCmpResult = -1;
                postCmpResultType = typeB;
                offsetB += lenB;
                continue;
            }
        }

        firstPart = false;

        if (typeA !== typeB) {
            return typeA < typeB ? -1 : 1;
        }

        preventFloat = false;
        preventSign = false;

        // both parts are the same type, no matter which type to test
        if (typeA === TYPE_EOF) {
            return postCmpResult;
        }

        // find difference in substr
        const minLength = lenA < lenB ? lenA : lenB;
        let substrDiff = lenA - lenB;
        let substrDiffIdx = 0;
        for (; substrDiffIdx < minLength; substrDiffIdx++) {
            const cA = a[offsetA + substrDiffIdx];
            const cB = b[offsetB + substrDiffIdx];

            if (cA !== cB) {
                substrDiff = cA < cB ? -1 : 1;
                break;
            }
        }

        // both parts are the same type, no matter which type to test
        if (typeA === TYPE_WS || typeA === TYPE_DELIM) {
            if (substrDiff !== 0 && (postCmpResult === 0 || typeA > postCmpResultType)) {
                postCmpResultType = typeA;
                postCmpResult = substrDiff;
            }

            preventFloat = a[offsetA + lenA - 1] === '.';
        } else if (typeA === TYPE_NUM) {
            preventSign = true;

            if (substrDiff !== 0) {
                const numDiff = a.substr(offsetA, lenA) - b.substr(offsetB, lenB);

                if (numDiff !== 0) {
                    return analytical ? -numDiff : numDiff;
                }

                if (postCmpResult === 0 || typeA > postCmpResultType) {
                    const afc = safeCharCodeAt(a, offsetA);
                    const bfc = safeCharCodeAt(b, offsetB);
                    const order = afc === 0x002D ? -1 : 1;

                    // a/b  -  o  +
                    //   -  0 -1 -1
                    //   o  1  0 -1
                    //   +  1  1  0

                    postCmpResultType = typeA;
                    postCmpResult = afc !== bfc && (afc === 0x002D /* - */ || bfc === 0x002B /* + */)
                        ? -1
                        : afc !== bfc && (afc === 0x002B /* + */ || bfc === 0x002D /* - */)
                            ? 1
                            : (lenA !== lenB ? lenA < lenB : substrDiff < 0) ? -order : order;

                    if (analytical) {
                        postCmpResult = -postCmpResult;
                    }
                }
            }
        } else { // typeA === TYPE_WORD
            if (substrDiff !== 0) {
                if (substrDiffIdx < minLength) {
                    // case insensitive checking
                    let cnA = a[offsetA + substrDiffIdx].toLowerCase();
                    let cnB = b[offsetB + substrDiffIdx].toLowerCase();

                    if (cnA !== cnB) {
                        return cnA < cnB ? -1 : 1;
                    }
                }

                return substrDiff;
            }

            preventFloat = a[offsetA + lenA - 1] === '.';
        }

        offsetA += lenA;
        offsetB += lenB;
    } while (true);
}

function naturalCompare(a, b) {
    const typeA = typeof a;
    const typeB = typeof b;
    let ret = 0;

    if (debug) {
        console.log('Compare', a, b);
    }

    if ((typeA === 'number' || typeA === 'string') && (typeB === 'number' || typeB === 'string')) {
        ret = compare(String(a), String(b), false);
    }

    if (debug) {
        console.log('Result:', ret);
    }

    return ret;
};

function naturalAnalyticalCompare(a, b) {
    const typeA = typeof a;
    const typeB = typeof b;
    let ret = 0;

    if (debug) {
        console.log('Compare', a, b);
    }

    if ((typeA === 'number' || typeA === 'string') && (typeB === 'number' || typeB === 'string')) {
        ret = compare(String(a), String(b), true);
    }

    if (debug) {
        console.log('Result:', ret);
    }

    return ret;
};

module.exports = {
    naturalCompare,
    naturalAnalyticalCompare
};
