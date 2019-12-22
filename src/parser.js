const fs = require('fs');
const { Parser } = require('jison');
const grammar = require('./grammar');

function bake() {
    return fs.writeFileSync(__filename, this.generateModule());
}

function patchParsers(strictParser) {
    function patch(subject, patches) {
        Object.entries(patches).forEach(([key, patch]) =>
            subject[key] = patch(subject[key])
        );
    }

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

            if (commentFrom > to) {
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

    function processSuggestRanges(input, suggestRanges, commentRanges) {
        const result = [];
        const noSuggestOnEofPos = // edge case when source ends with a comment with no newline
            commentRanges.length &&
            commentRanges[commentRanges.length - 1][1] === input.length &&
            !/[\r\n]$/.test(input);

        for (let i = 0; i < suggestRanges.length; i++) {
            let [start, end, types, context, ref] = suggestRanges[i];

            if (start === null) {
                start = end.range[0];
                end = end.range[0];
            } else if (end === null) {
                end = start.range[1];
                start = start.range[1];
            } else if (start.range[0] > end.range[0]) {
                const tmp = start;
                start = end.range[1];
                end = tmp.range[0];
            } else {
                start = start.range[0];
                end = end.range[1];
            }

            if (onlyWsInRange(input, start, end)) {
                while (start >= 0 && isWhiteSpace(input, start - 1)) {
                    start--;
                }

                while (end < input.length && isWhiteSpace(input, end)) {
                    end++;
                }

                // when starts on keyword/number/var end
                if (isSuggestProhibitedChar(input, start - 1)) {
                    if (start === end) {
                        continue;
                    }
                    start++;
                }

                // when ends on keyword/number/var start
                if (isSuggestProhibitedChar(input, end)) {
                    if (start === end) {
                        continue;
                    }
                    end--;
                }
            }

            if (!Array.isArray(types)) {
                types = [types];
            }

            const ranges = getSuggestRanges(start, end, input, commentRanges, noSuggestOnEofPos);
            for (let j = 0; j < ranges.length; j += 2) {
                types.forEach(type =>
                    result.push([ranges[j], ranges[j + 1], type, context, ref || null])
                );
            }
        }

        return result;
    }

    // patch generateModule
    patch(strictParser, {
        bake: () => function() {
            bake.call(this);
        },
        generateModule: origGenerateModule => function() {
            return origGenerateModule
                .call(this, { moduleName: 'module.exports' })
                .replace('new Parser', '(' + patchParsers + ')(new Parser)');
        }
    });

    // add new helpers to lexer
    Object.assign(strictParser.lexer, {
        toStringLiteral: value => JSON.parse(
            value[0] === '\''
                ? value.replace(/\\?"/g, '\\"')
                    .replace(/\\([^"uU])/g, '$1')
                    .replace(/^\'|\'$/g, '"')
                : value
        ),
        toRegExp: value => new RegExp(
            value.substr(1, value.lastIndexOf('/') - 1),
            value.substr(value.lastIndexOf('/') + 1)
        )
    });

    // patch setInput method to add additional lexer fields on init
    patch(strictParser.lexer, {
        setInput: origSetInput => function(input, yy) {
            const suggestRanges = [];
            const commentRanges = [];

            yy.commentRanges = commentRanges;
            yy.suggestRanges = suggestRanges;
            yy.buildResult = ast => ({
                ast,
                commentRanges,
                get suggestRanges() {
                    return processSuggestRanges(input, suggestRanges, commentRanges);
                }
            });

            this.fnOpened = 0;
            this.fnOpenedStack = [];
            this.prevToken = null;
            this.prevYylloc = {
                first_line: 1,
                last_line: 1,
                first_column: 0,
                last_column: 0,
                range: [0, 0]
            };

            return origSetInput.call(this, input, yy);
        }
    });

    //
    // tolerant parser
    //
    const tolerantParser = new strictParser.Parser();
    tolerantParser.lexer = Object.assign({}, strictParser.lexer);

    // patch tolerant parser lexer
    const keywords = [
        'AND', 'OR', 'IN', 'NOTIN', 'HAS', 'HASNO'
    ];
    const words = [...keywords, 'NOT', 'ASC', 'DESC'];
    const operators = [
        '+', '-', '*', '/', '%',
        '=', '!=', '~=', '>=', '<=', '<', '>'
    ];
    const prev = [
        null, ':', ';',
        ',', '.', '..',
        ...operators,
        ...keywords, 'NOT'
    ];
    const defaultNext = new Set([
        ',', '?', ':', ';', 'EOF',
        ']', ')', '}',
        ...operators,
        ...keywords,
        'ASC', 'DESC'
    ]);
    const tokenPair = new Map(prev.map(token => [token, defaultNext]));
    // special cases
    tokenPair.set('{', new Set([',']));
    tokenPair.set('[', new Set([',']));
    tokenPair.set('(', new Set([',']));

    patch(tolerantParser.lexer, {
        lex: origLex => function patchedLex() {
            this.lex = origLex;
            const prevInput = this._input;
            const nextToken = this.lex(this);
            this.lex = patchedLex;

            if (tokenPair.has(this.prevToken) && tokenPair.get(this.prevToken).has(nextToken)) {
                const yylloc = {
                    first_line: this.prevYylloc.last_line,
                    last_line: this.yylloc.first_line,
                    first_column: this.prevYylloc.last_column,
                    last_column: this.yylloc.first_column,
                    range: [this.prevYylloc.range[1], this.yylloc.range[0]]
                };
                this.unput(this.yytext);
                this.pushState('preventPrimitive');
                this.done = false;
                this.yytext = '_';
                this.yylloc = this.prevYylloc = yylloc;

                // position correction for a white space before a keyword
                if (prevInput !== this._input && words.includes(nextToken)) {
                    const prevChIndex = prevInput.length - this._input.length - 1;

                    switch (prevInput[prevChIndex]) {
                        case ' ':
                        case '\t':
                            yylloc.last_column--;
                            yylloc.range[1]--;
                            break;

                        case '\n': {
                            const lastN = prevInput.lastIndexOf('\n', prevChIndex - 1);

                            yylloc.last_line--;
                            yylloc.last_column = lastN === -1
                                ? yylloc.last_column - 1
                                : prevChIndex - lastN;
                            yylloc.range[1]--;
                            break;
                        }
                    }
                }

                return this.prevToken = 'SYMBOL';
            }

            this.prevYylloc = this.yylloc;

            // position correction for a white space after a keyword
            if (words.includes(nextToken)) {
                switch (this._input[0]) {
                    case ' ':
                    case '\t':
                        this.prevYylloc = Object.assign({}, this.prevYylloc, {
                            last_column: this.prevYylloc.last_column + 1,
                            range: [this.prevYylloc.range[0], this.prevYylloc.range[1] + 1]
                        });
                        break;

                    case '\n':
                        this.prevYylloc = Object.assign({}, this.prevYylloc, {
                            last_line: this.prevYylloc.last_line + 1,
                            last_column: 0,
                            range: [this.prevYylloc.range[0], this.prevYylloc.range[1] + 1]
                        });
                        break;
                }
            }

            return this.prevToken = nextToken;
        }
    });

    // tolerantParser.lexer.setInput('\n//test\n\nor', {});
    // while (!tolerantParser.lexer.done) {
    //     console.log(tolerantParser.lexer.conditionStack);
    //     console.log('>', tolerantParser.lexer.lex());
    // }
    // process.exit();

    strictParser.strict = strictParser;
    strictParser.tolerant = tolerantParser;

    return strictParser;
};

module.exports = patchParsers(new Parser(grammar));
