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
                this.fnOpened = 0;
                this.fnOpenedStack = [];
                yy.commentRanges = [];

                return orig.call(this, input, yy);
            }
        })
    );

    patch(tolerantParser.lexer, {
        lex: orig => {
            let prevToken = null;
            let prevYylloc = {
                first_line: 1,
                last_line: 1,
                first_column: 0,
                last_column: 0,
                range: [0, 0]
            };
            const keywords = [
                'AND', 'OR', 'IN', 'NOTIN', 'NOT'
            ];
            const operators = [
                '+', '-', '*', '/', '%',
                '=', '!=', '~=', '>=', '<=', '<', '>'
            ];
            const prev = [
                null, ':', ';',
                ',', '.', '..',
                ...operators,
                ...keywords
            ];
            const defaultNext = new Set([
                ',', '?', ':', ';', 'EOF',
                ']', ')', '}',
                ...operators
            ]);
            const tokenPair = prev.reduce(
                (map, prevToken) => map.set(prevToken, defaultNext),
                new Map()
            );
            // special cases
            tokenPair.set('{', new Set([',']));
            tokenPair.set('[', new Set([',']));

            return function patchedLex() {
                this.lex = orig;
                const nextToken = this.lex(this);
                this.lex = patchedLex;

                if (tokenPair.has(prevToken) && tokenPair.get(prevToken).has(nextToken)) {
                    const yylloc = {
                        first_line: prevYylloc.last_line,
                        last_line: this.yylloc.first_line,
                        first_column: prevYylloc.last_column,
                        last_column: this.yylloc.first_column,
                        range: [prevYylloc.range[1], this.yylloc.range[0]]
                    };
                    this.unput(this.yytext);
                    this.done = false;
                    this.yytext = '_';
                    this.yylloc = prevYylloc = yylloc;
                    this.pushState('preventPrimitive');

                    return prevToken = 'SYMBOL';
                }

                prevYylloc = this.yylloc;
                if (keywords.includes(nextToken)) {
                    switch (this._input[0]) {
                        case ' ':
                        case '\t':
                            prevYylloc = Object.assign({}, prevYylloc, {
                                last_column: prevYylloc.last_column + 1,
                                range: [prevYylloc.range[0], prevYylloc.range[1] + 1]
                            });
                            break;

                        case '\n':
                            prevYylloc = Object.assign({}, prevYylloc, {
                                last_line: prevYylloc.last_line + 1,
                                last_column: 0,
                                range: [prevYylloc.range[0], prevYylloc.range[1] + 1]
                            });
                            break;
                    }
                }

                return prevToken = nextToken;
            };
        }
    });

    // tolerantParser.lexer.setInput('. < 5', {});
    // while (!tolerantParser.lexer.done) {
    //     console.log(tolerantParser.lexer.conditionStack);
    //     console.log('>', tolerantParser.lexer.lex());
    // }
    // process.exit();

    strictParser.strict = strictParser;
    strictParser.tolerant = tolerantParser;

    return strictParser;
};
