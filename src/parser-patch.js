// temporary file with parser extension
module.exports = function patchParsers(strictParser) {
    function patch(subject, patches) {
        Object.entries(patches).forEach(([key, patch]) =>
            subject[key] = patch(subject[key])
        );
    }

    const tolerantParser = new strictParser.Parser();
    tolerantParser.lexer = Object.assign({}, strictParser.lexer);

    // patch setInput method to add additional lexer fields on init
    [strictParser.lexer, tolerantParser.lexer].forEach(subject =>
        patch(subject, {
            setInput: orig => function(input, yy) {
                yy.commentRanges = [];
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

                return orig.call(this, input, yy);
            }
        })
    );

    // patch lex method
    const keywords = [
        'AND', 'OR', 'IN', 'NOTIN', 'HAS', 'HASNO'
    ];
    const words = [...keywords, 'NOT'];
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
        ...keywords
    ]);
    const tokenPair = prev.reduce(
        (map, prevToken) => map.set(prevToken, defaultNext),
        new Map()
    );
    // special cases
    tokenPair.set('{', new Set([',']));
    tokenPair.set('[', new Set([',']));
    tokenPair.set('(', new Set([',']));

    patch(tolerantParser.lexer, {
        lex: origLex =>
            function patchedLex() {
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
