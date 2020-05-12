const nodes = require('./nodes').suggest;
const walk = require('./walk');

function isSuggestProhibitedChar(str, offset) {
    return (
        offset >= 0 &&
        offset < str.length &&
        /[a-zA-Z_$0-9]/.test(str[offset])
    );
}

function isWhiteSpace(str, offset) {
    const code = str.charCodeAt(offset);
    return code === 9 || code === 10 || code === 13 || code === 32;
}

function onlyWsInRange(str, start, end) {
    for (; start < end; start++) {
        if (!isWhiteSpace(str, start)) {
            return false;
        }
    }

    return true;
}

function getSuggestRanges(from, to, input, commentRanges, noSuggestOnEofPos) {
    const ranges = [];

    for (let i = 0; i < commentRanges.length; i++) {
        const [commentFrom, commentTo] = commentRanges[i];

        if (commentFrom >= to) {
            break;
        }

        if (commentFrom < from) {
            continue;
        }

        if (commentFrom === from) {
            ranges.push(from, from);
        } else {
            ranges.push(from, commentFrom);
        }

        from = commentTo;
    }

    if (from !== input.length || !noSuggestOnEofPos) {
        ranges.push(from, to);
    }

    return ranges;
}

function processSuggestRanges(suggestRanges, source, commentRanges) {
    const result = [];
    const noSuggestOnEofPos = // edge case when source ends with a comment with no newline
        commentRanges.length &&
        commentRanges[commentRanges.length - 1][1] === source.length &&
        !/[\r\n]$/.test(source);

    for (let i = 0; i < suggestRanges.length; i++) {
        let [start, end, types, current] = suggestRanges[i];

        if (onlyWsInRange(source, start, end)) {
            while (start >= 0 && isWhiteSpace(source, start - 1)) {
                start--;
            }

            while (end < source.length && isWhiteSpace(source, end)) {
                end++;
            }

            // when starts on keyword/number/var end
            if (isSuggestProhibitedChar(source, start - 1)) {
                if (start === end) {
                    continue;
                }
                start++;
            }

            // when ends on keyword/number/var start
            if (isSuggestProhibitedChar(source, end)) {
                if (start === end) {
                    continue;
                }
                end--;
            }
        }

        if (!Array.isArray(types)) {
            types = [types];
        }

        const ranges = getSuggestRanges(start, end, source, commentRanges, noSuggestOnEofPos);
        for (let j = 0; j < ranges.length; j += 2) {
            types.forEach(type =>
                result.push([ranges[j], ranges[j + 1], type, current])
            );
        }
    }

    return result;
}

function collectRanges(ast) {
    let currentNode = null;
    const suggestions = new Map();
    const add = (node, range) => {
        if (!suggestions.has(node)) {
            suggestions.set(node, [range]);
        } else {
            suggestions.get(node).push(range);
        }
    };
    const ctx = {
        range(range, type, current, node = currentNode) {
            add(node, [...range, type, Boolean(current)]);
        },
        queryRoot(start, end = start) {
            add(currentNode, [start, end, 'var', true]);
            add(currentNode, [start, end, 'path', true]);
        }
    };

    walk(ast, (node) => {
        if (nodes.has(node.type)) {
            const prevNode = currentNode;
            currentNode = node;

            nodes.get(node.type)(node, ctx);

            currentNode = prevNode;
        }
    });

    return suggestions;
}

module.exports = function suggest(ast, source, commentRanges) {
    const nodes = collectRanges(ast);
    const ranges = [];

    for (const [node, rawRanges] of nodes) {
        node.suggestions = processSuggestRanges(rawRanges, source, commentRanges);
        ranges.push(...node.suggestions);
    }

    return ranges;
};
