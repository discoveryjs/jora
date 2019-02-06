// temporary file with parser extension
module.exports = function patchParsers(strictParser, tolerantParser) {
    // patch setInput method to add additional lexer fields on init
    strictParser.lexer.setInput =
    tolerantParser.lexer.setInput = (function(orig) {
        return function(...args) {
            this.fnOpened = 0;
            this.fnOpenedStack = [];
            return orig.apply(this, args);
        };
    }(strictParser.lexer.setInput));

    // tolerantParser.lexer.lex = (function(orig) {
    //     let prev = null;
    //     return function() {
    //         this.prevLex = prev;
    //         const ret = orig.call(this);
    //         prev = ret;
    //         return ret;
    //     };
    // }(tolerantParser.lexer.lex));
};
