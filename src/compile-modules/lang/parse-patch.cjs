// INPORTANT: This function must not have external dependencies,
// since its source uses as is when parser is generating
module.exports = function buildParsers(strictParser) {
    function patch(subject, patches) {
        Object.entries(patches).forEach(([key, patch]) =>
            subject[key] = patch(subject[key])
        );
    }

    // better error details
    const humanTokens = new Map([
        ['EOF', ['<end of input>']],
        ['IDENT', ['ident']],
        ['$IDENT', ['$ident']],
        ['FUNCTION_START', ["'<'"]],
        ['FUNCTION_END', ["'>'"]],
        ['FUNCTION', ["'=>'"]],
        ['NOT', ["'not'"]],
        ['IN', ["'in'"]],
        ['HAS', ["'has'"]],
        ['NOTIN', ["'not in'"]],
        ['HASNO', ["'has no'"]],
        ['AND', ["'and'"]],
        ['OR', ["'or'"]],
        ['STRING', ['string']],
        ['TPL_START', ['template']],
        ['TEMPLATE', ['template']],
        ['NUMBER', ['number']],
        ['REGEXP', ['regexp']],
        ['LITERAL', ["'true'", "'false'", "'null'", "'undefined'"]],
        ['ORDER', ["'asc'", "'desc'", "'ascN'", "'descN'"]]
    ]);
    const tokenForHumans = token => humanTokens.get(token) || `'${token}'`;
    const parseError = function(rawMessage, details = {}, yy) {
        if (details.recoverable) {
            this.trace(rawMessage);
        } else {
            if (Array.isArray(details.inside)) {
                const start = yy.lexer.offset - yy.lexer.match.length;

                yy.lexer.setMatch(
                    start + details.inside[0],
                    start + details.inside[1]
                );
            }

            const yylloc = yy.lexer.yylloc;
            const message = [
                rawMessage.split(/\n/)[0],
                '',
                yy.lexer.showPosition()
            ];
            const expected = !Array.isArray(details.expected) ? null : [...new Set([].concat(
                ...details.expected.map(token => tokenForHumans(token.slice(1, -1)))
            ))];

            if (expected) {
                message.push(
                    '',
                    'Expecting ' + expected.join(', ') + ' got ' + tokenForHumans(details.token)
                );
            }

            const error = new SyntaxError(message.join('\n'));

            error.details = {
                rawMessage: rawMessage,
                text: details.text,
                token: details.token,
                expected,
                loc: {
                    range: yylloc.range,
                    start: {
                        line: yylloc.first_line,
                        column: yylloc.first_column,
                        offset: yylloc.range[0]
                    },
                    end: {
                        line: yylloc.last_line,
                        column: yylloc.last_column,
                        offset: yylloc.range[1]
                    }
                }
            };

            throw error;
        }
    };

    // add new helpers to lexer
    const lineTerminator = new Set(['\n', '\r', '\u2028', '\u2029']);
    const literals = new Map([
        ['null', null],
        ['false', false],
        ['true', true],
        ['Infinity', Infinity],
        ['NaN', NaN]
    ]);
    Object.assign(strictParser.lexer, {
        ident: value => value.replace(/\\u[0-9a-fA-F]{4}/g, m => String.fromCharCode(parseInt(m.slice(2), 16))),

        toLiteral: value => literals.get(value),

        toStringLiteral(value, multiline = false, end = 1) {
            const valueEnd = value.length - end;
            let result = '';

            for (let i = 1; i < valueEnd; i++) {
                if (!multiline && lineTerminator.has(value[i])) {
                    this.parseError('Invalid line terminator', { inside: [i, i + 1] });
                }

                if (value[i] !== '\\') {
                    result += value[i];
                    continue;
                }

                if (i === valueEnd - 1) {
                    this.parseError('Invalid backslash', { inside: [i, i + 1] });
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

                        this.parseError('Invalid Unicode escape sequence', {
                            inside: [i - 1, Math.min(i + 1 + hex.length, valueEnd)]
                        });
                        break;
                    }

                    case 'x': {
                        const [hex = ''] = value.slice(i + 1, i + 3).match(/^[0-9a-f]*/i) || [];

                        if (hex.length === 2) {
                            result += String.fromCharCode(parseInt(hex, 16));
                            i += 2;
                            break;
                        }

                        this.parseError('Invalid hexadecimal escape sequence', {
                            inside: [i - 1, Math.min(i + 1 + hex.length, valueEnd)]
                        });
                        break;
                    }

                    default:
                        result += next;
                }
            }

            return result;
        },

        toRegExp(value) {
            const flagsIndex = value.lastIndexOf('/') + 1;
            const flags = value.substr(flagsIndex);

            flags.split('').forEach((flag, idx, array) => {
                const duplicateIndex = array.indexOf(flag, idx + 1);
                if (duplicateIndex !== -1) {
                    this.parseError('Duplicate flag in regexp', {
                        inside: [flagsIndex + duplicateIndex, flagsIndex + duplicateIndex + 1]
                    });
                }
            });

            return new RegExp(
                value.substr(1, value.lastIndexOf('/') - 1),
                flags
            );
        }
    });

    // patch setInput method to add additional lexer fields on init
    patch(strictParser.lexer, {
        setInput: origSetInput => function(input, yy) {
            const commentRanges = [];

            yy.commentRanges = commentRanges;
            yy.buildResult = ast => ({
                ast,
                commentRanges
            });
            yy.parseError = function(...args) {
                // parser doesn't expose sharedState and it's unavailable in parseError
                return parseError.call(this, ...args, yy);
            };
            yy.pps = () => {
                if (!this.eof()) {
                    this.begin('preventPrimitive');
                }
            };

            this.fnOpened = 0;
            this.fnOpenedStack = [];
            this.bracketStack = [];
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
    tolerantParser.lexer = { ...strictParser.lexer };
    tolerantParser.yy = { ...strictParser.yy };

    // patch tolerant parser lexer
    const keywords = [
        'AND', 'OR', 'IN', 'NOTIN', 'HAS', 'HASNO'
    ];
    const words = [...keywords, 'NOT', 'ORDER'];
    const operators = [
        '+', '-', '*', '/', '%', '|',
        '=', '!=', '~=', '>=', '<=', '<', '>'
    ];
    const prev = [
        null, ':', ';',
        ',', '.', '..',
        '(', '[',
        '.(', '..(', '.[',
        'FUNCTION',
        ...operators,
        ...keywords,
        'NOT'
    ];
    const defaultNext = new Set([
        ',', '?', ':', ';', 'EOF',
        ']', ')', '}',
        'TPL_CONTINUE', 'TPL_END',
        ...operators,
        ...keywords,
        'ORDER'
    ]);
    const tokenPair = new Map(prev.map(token => [token, defaultNext]));
    // special cases
    tokenPair.set('{', new Set([',']));
    tokenPair.set('[', new Set([...defaultNext, ',']));
    tokenPair.set('(', new Set([...defaultNext, ',']));

    patch(tolerantParser.lexer, {
        lex: origLex => function patchedLex() {
            const prevOffset = this.offset;
            const nextToken = origLex.call(this);

            if (tokenPair.has(this.prevToken) && tokenPair.get(this.prevToken).has(nextToken)) {
                const yylloc = {
                    first_line: this.prevYylloc.last_line,
                    last_line: this.yylloc.first_line,
                    first_column: this.prevYylloc.last_column,
                    last_column: this.yylloc.first_column,
                    range: [this.prevYylloc.range[1], this.yylloc.range[0]]
                };
                this.unput(this.match);
                this.pushState('preventPrimitive');
                this.done = false;
                this.yytext = '_';
                this.yylloc = this.prevYylloc = yylloc;

                // position correction for a white space before a keyword
                if (prevOffset !== this.offset && words.includes(nextToken)) {
                    switch (this._input[prevOffset]) {
                        case ' ':
                        case '\t':
                            yylloc.last_column--;
                            yylloc.range[1]--;
                            break;

                        case '\n': {
                            const lastN = this._input.lastIndexOf('\n', prevOffset - 1);

                            yylloc.last_line--;
                            yylloc.last_column = lastN === -1
                                ? yylloc.last_column - 1
                                : prevOffset - lastN;
                            yylloc.range[1]--;
                            break;
                        }
                    }
                }

                return this.prevToken = 'IDENT';
            }

            this.prevYylloc = this.yylloc;

            // position correction for a white space after a keyword
            if (words.includes(nextToken)) {
                switch (this._input[this.offset]) {
                    case ' ':
                    case '\t':
                        this.prevYylloc = {
                            ...this.prevYylloc,
                            last_column: this.prevYylloc.last_column + 1,
                            range: [this.prevYylloc.range[0], this.prevYylloc.range[1] + 1]
                        };
                        break;

                    case '\n':
                        this.prevYylloc = {
                            ...this.prevYylloc,
                            last_line: this.prevYylloc.last_line + 1,
                            last_column: 0,
                            range: [this.prevYylloc.range[0], this.prevYylloc.range[1] + 1]
                        };
                        break;
                }
            }

            return this.prevToken = nextToken;
        }
    });

    // bracket balance & scope
    const openBalance = new Map([
        ['(', ')'],
        ['.(', ')'],
        ['..(', ')'],
        ['[', ']'],
        ['.[', ']'],
        ['{', '}'],
        ['TPL_START', 'TPL_END']
    ]);
    const closeBalance = new Set([')', ']', '}', 'TPL_END']);
    const balanceScopeLex = origLex => function patchedLex() {
        const token = origLex.call(this);

        if (closeBalance.has(token)) {
            const expected = this.bracketStack.pop();

            if (expected !== token) {
                this.parseError(`Expected "${expected}" got "${token}"`);
            }

            this.fnOpened = this.fnOpenedStack.pop() || 0;
        }

        if (openBalance.has(token)) {
            this.bracketStack.push(openBalance.get(token));
            this.fnOpenedStack.push(this.fnOpened);
            this.fnOpened = 0;
        }

        return token;
    };
    patch(strictParser.lexer, {
        lex: balanceScopeLex
    });
    patch(tolerantParser.lexer, {
        lex: balanceScopeLex
    });

    return {
        parse(source, tolerantMode) {
            return tolerantMode
                ? tolerantParser.parse(source)
                : strictParser.parse(source);
        },
        *tokenize(source, tolerantMode, loc) {
            const parser = tolerantMode ? tolerantParser : strictParser;
            const lexer = Object.create(parser.lexer);

            lexer.setInput(source, { parser });

            while (!lexer.done) {
                const token = {
                    type: lexer.lex(),
                    value: lexer.match,
                    offset: lexer.yylloc.range[0]
                };

                if (loc) {
                    token.loc = {
                        range: lexer.yylloc.range,
                        start: {
                            line: lexer.yylloc.first_line,
                            column: lexer.yylloc.first_column
                        },
                        end: {
                            line: lexer.yylloc.last_line,
                            column: lexer.yylloc.last_column
                        }
                    };
                }

                yield token;
            }
        }
    };
};
