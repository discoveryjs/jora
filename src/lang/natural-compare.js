const TYPE_EOF = 0;
const TYPE_WS = 1;
const TYPE_NUM = 2;
const TYPE_DELIM = 3;
const TYPE_WORD = 4;
const T = ['eof', 'ws', 'number', 'delim', 'word'];
let debug = false;

function isWS(code) {
    return (
        code === 0x0009 ||  // \t
        code === 0x000A ||  // \n
        code === 0x000C ||  // \f
        code === 0x000D ||  // \r
        code === 0x0020     // whitespace
    );
}

function isDelim(code) {
    return (
        code === 0x0021 ||  // !
        code === 0x0022 ||  // "
        code === 0x0023 ||  // #
        code === 0x0024 ||  // $
        code === 0x0025 ||  // %
        code === 0x0026 ||  // &
        code === 0x0027 ||  // '
        code === 0x0028 ||  // (
        code === 0x0029 ||  // )
        code === 0x002a ||  // *
        // +
        code === 0x002c ||  // ,
        // -
        code === 0x002e ||  // .
        code === 0x002f ||  // /
        code === 0x003a ||  // :
        code === 0x003b ||  // ;
        code === 0x003c ||  // <
        code === 0x003d ||  // =
        code === 0x003e ||  // >
        code === 0x003f ||  // ?
        code === 0x0040 ||  // @
        code === 0x005b ||  // [
        code === 0x005c ||  // \
        code === 0x005d ||  // ]
        code === 0x005e ||  // ^
        code === 0x005f ||  // _
        code === 0x0060 ||  // `
        code === 0x007b ||  // {
        code === 0x007c ||  // |
        code === 0x007d ||  // }
        code === 0x007e ||  // ~
        code === 0x00a7 ||  // §
        code === 0x00ab ||  // «
        code === 0x00b1 ||  // ±
        code === 0x00b4 ||  // ´
        code === 0x00bb ||  // »
        code === 0x2116     // №
    );
}

function isDigit(code) {
    return code >= 0x0030 && code <= 0x0039;
}

//  Check if three code points would start a number
function isNumberStart(first, second, third) {
    // Look at the first code point:

    // U+002B PLUS SIGN (+)
    // U+002D HYPHEN-MINUS (-)
    if (first === 0x002B || first === 0x002D) {
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

// uppercase letter
// A code point between U+0041 LATIN CAPITAL LETTER A (A) and U+005A LATIN CAPITAL LETTER Z (Z).
function isUppercaseLetter(code) {
    return code >= 0x0041 && code <= 0x005A;
}

function cmpChar(testStr, offset, referenceCode) {
    let code = testStr.charCodeAt(offset);

    // code.toLowerCase() for A..Z
    if (isUppercaseLetter(code)) {
        code = code | 32;
    }

    return code === referenceCode;
}

function findDecimalNumberEnd(source, offset) {
    for (; offset < source.length; offset++) {
        if (!isDigit(source.charCodeAt(offset))) {
            break;
        }
    }

    return offset;
}

function consumeNumber(source, offset, preventFloat) {
    var code = source.charCodeAt(offset);

    // If the next input code point is U+002B PLUS SIGN (+) or U+002D HYPHEN-MINUS (-),
    // consume it and append it to repr.
    if (code === 0x002B || code === 0x002D) {
        code = source.charCodeAt(offset += 1);
    }

    // While the next input code point is a digit, consume it and append it to repr.
    if (isDigit(code)) {
        offset = findDecimalNumberEnd(source, offset + 1);
        code = source.charCodeAt(offset);
    }

    // If the next 2 input code points are U+002E FULL STOP (.) followed by a digit, then:
    if (code === 0x002E && isDigit(source.charCodeAt(offset + 1))) {
        if (preventFloat) {
            return offset;
        }

        // Consume them
        let expectedEnd = offset + 2;

        // While the next input code point is a digit, consume it and append it to repr.
        expectedEnd = findDecimalNumberEnd(source, expectedEnd);

        // If next char is U+002E FULL STOP (.), then don't consume
        if (expectedEnd < source.length && source.charCodeAt(expectedEnd) === 0x002E) {
            return offset;
        }

        offset = expectedEnd;
    }

    // If the next 2 or 3 input code points are U+0045 LATIN CAPITAL LETTER E (E)
    // or U+0065 LATIN SMALL LETTER E (e), ... , followed by a digit, then:
    if (cmpChar(source, offset, 101 /* e */)) {
        var sign = 0;
        code = source.charCodeAt(offset + 1);

        // ... optionally followed by U+002D HYPHEN-MINUS (-) or U+002B PLUS SIGN (+) ...
        if (code === 0x002D || code === 0x002B) {
            sign = 1;
            code = source.charCodeAt(offset + 2);
        }

        // ... followed by a digit
        if (isDigit(code)) {
            // While the next input code point is a digit, consume it and append it to repr.
            offset = findDecimalNumberEnd(source, offset + 1 + sign + 1);
        }
    }

    return offset;
}

function getTwoCharCodes(source, offset) {
    return [source.charCodeAt(offset) || 0, source.charCodeAt(offset + 1) || 0];
}

function getPart(source, offset, preventFloat, preventSign) {
    if (offset >= source.length) {
        return { type: TYPE_EOF };
    }

    let a = source.charCodeAt(offset);

    // Whitespace
    if (isWS(a)) {
        let end = offset + 1;

        while (end < source.length && isWS(source.charCodeAt(end))) {
            end++;
        }

        return { type: TYPE_WS, len: end - offset };
    }

    // Delim sequence
    // console.log(source[offset], isDelim(a), a.toString(16), preventSign)
    if (isDelim(a) || (preventSign && (a === 0x002b /* + */ || a === 0x002d /* - */))) {
        let end = offset + 1;

        while (end < source.length && isDelim(source.charCodeAt(end))) {
            end++;
        }

        return { type: TYPE_DELIM, len: end - offset };
    }

    // Number
    let [b, c] = getTwoCharCodes(source, offset + 1);
    if (isNumberStart(a, b, c)) {
        return { type: TYPE_NUM, len: consumeNumber(source, offset, preventFloat) - offset };
    }

    // Word
    let end = offset + 3;
    do {
        [a, b, c] = [b, c, source.charCodeAt(end++)];
    } while (end - 3 < source.length && !isWS(a) && !isDelim(a) && !isDigit(a));

    return { type: TYPE_WORD, len: end - offset - 3 };
}


function naturalCompare(a, b) {
    let offsetA = 0;
    let offsetB = 0;
    let preventFloat = false;
    let preventSign = false;
    let postCmpResult = 0;
    let postCmpResultType = 0;
    let firstPart = true;

    do {
        const { type: typeA, len: lenA } = getPart(a, offsetA, preventFloat, preventSign);
        const { type: typeB, len: lenB } = getPart(b, offsetB, preventFloat, preventSign);

        if (debug) {
            console.log({
                typeA: T[typeA], lenA, substrA: a.slice(offsetA, offsetA + lenA),
                typeB: T[typeB], lenB, substrB: b.slice(offsetB, offsetB + lenB)
            });
        }

        if (typeA !== typeB && firstPart) {
            if ((typeA === TYPE_WS || typeA === TYPE_DELIM) && (typeB === TYPE_NUM || typeB === TYPE_WORD)) {
                postCmpResult = 1;
                offsetA += lenA;
                continue;
            }

            if ((typeB === TYPE_WS || typeB === TYPE_DELIM) && (typeA === TYPE_NUM || typeA === TYPE_WORD)) {
                postCmpResult = -1;
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

        switch (typeA) { // both parts are the same type
            case TYPE_EOF:
                return postCmpResult;

            case TYPE_WS:
            case TYPE_DELIM: {
                const substrA = a.slice(offsetA, offsetA + lenA);
                const substrB = b.slice(offsetB, offsetB + lenB);

                // TODO: replace substrA !== substrB for cmpStr(a, b): -1 | 0 | 1
                if (substrA !== substrB && (postCmpResult === 0 || typeA > postCmpResultType)) {
                    postCmpResultType = typeA;
                    postCmpResult = substrA < substrB ? -1 : 1;
                }

                preventFloat = a[offsetA + lenA - 1] === '.';
                break;
            }

            case TYPE_NUM: {
                const substrA = a.slice(offsetA, offsetA + lenA);
                const substrB = b.slice(offsetB, offsetB + lenB);

                preventSign = true;

                if (substrA !== substrB) { // TODO: replace for cmpStr(a, b): -1 | 0 | 1
                    const diff = Math.sign(Number(substrA) - Number(substrB));

                    if (diff !== 0) {
                        return diff;
                    }

                    if (postCmpResult === 0 || typeA > postCmpResultType) {
                        const afc = substrA[0];
                        const bfc = substrB[0];

                        postCmpResultType = typeA;

                        if (afc !== bfc) { // first chars are not equal
                            if (afc === '-') {
                                postCmpResult = -1;
                                break;
                            }

                            if (afc === '+') {
                                postCmpResult = 1;
                                break;
                            }

                            if (bfc === '-') {
                                postCmpResult = 1;
                                break;
                            }

                            if (bfc === '+') {
                                postCmpResult = -1;
                                break;
                            }
                        } else if (afc === '-') { // if both start with minus, then change sign of difference
                            postCmpResult = lenA !== lenB
                                ? (lenA < lenB ? 1 : -1)
                                : (substrA < substrB ? 1 : -1);
                            break;
                        }

                        postCmpResult = lenA !== lenB
                            ? (lenA < lenB ? -1 : 1)
                            : substrA < substrB ? -1 : 1;
                    }
                }

                break;
            }

            case TYPE_WORD: {
                for (let i = 0, len = Math.min(lenA, lenB); i < len; i++) {
                    const cA = a[offsetA + i];
                    const cB = b[offsetB + i];

                    if (cA !== cB) {
                        let cnA = cA.toLowerCase();
                        let cnB = cB.toLowerCase();

                        if (cnA !== cnB) {
                            return cnA < cnB ? -1 : 1;
                        }

                        return cA < cB ? -1 : 1;
                    }
                }

                if (lenA !== lenB) {
                    return lenA < lenB ? -1 : 1;
                }

                preventFloat = a[offsetA + lenA - 1] === '.';

                break;
            }
        }

        offsetA += lenA;
        offsetB += lenB;
    } while (true);
}

module.exports = function(a, b) {
    const typeA = typeof a;
    const typeB = typeof b;
    let ret = 0;

    if (debug) {
        console.log('Compare', a, b);
    }

    if ((typeA === 'number' || typeA === 'string') && (typeB === 'number' || typeB === 'string')) {
        ret = naturalCompare(String(a), String(b));
    }

    if (debug) {
        console.log('Result:', ret);
    }

    return ret;
};
