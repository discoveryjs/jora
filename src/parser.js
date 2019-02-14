const { Parser } = require('jison');
const patchParsers = require('./parser-patch');

function code(s) {
    return '$$ = [' +
        s[0].split(/(\$[\da-zA-Z_]+|\/\*(?:scope|define:\S+?|var:\S+?)\*\/|\/\*\S*@[\da-zA-Z_$]+(?:\/\S*@[\da-zA-Z_$]+)*\*\/\$?[\da-zA-Z_]+)/g).map(
            (m, i) => {
                if (i % 2 === 0 || m === '/*scope*/') {
                    return JSON.stringify(m);
                }

                if (m.startsWith('/*define:')) {
                    return '"/*define:" + ' + m.substring(9, m.length - 2) + '.range + "*/"';
                }

                if (m.startsWith('/*var:')) {
                    return '"/*var:" + ' + m.substring(6, m.length - 2) + '.range + "*/"';
                }

                if (m.startsWith('/*')) {
                    const content = m.substring(2, m.indexOf('*/'));
                    const expr = m.substr(content.length + 4);
                    const ranges = content.split('/').map(range => {
                        const [context, loc] = range.split('@');
                        return '" + @' + loc + '.range + ",' + context;
                    });

                    return (
                        '"/*s*/",' +
                        (expr[0] === '$' ? expr : '"' + expr + '"') +
                        ',"/*' + ranges + '*/"'
                    );
                }

                return m;
            }
        ).filter(term => term !== '""') +
    '];';
}

const switchToPreventPrimitiveState = 'if (this._input) this.begin("preventPrimitive"); ';
const openScope = 'this.fnOpenedStack.push(this.fnOpened); this.fnOpened = 0; ';
const closeScope = 'this.fnOpened = this.fnOpenedStack.pop() || 0; ';
const grammar = {
    // Lexical tokens
    lex: {
        options: {
            ranges: true
        },
        macros: {
            wb: '\\b',
            ows: '\\s*',  // optional whitespaces
            ws: '\\s+',   // required whitespaces
            comment: '//.*?(\\r|\\n|$)',
            rx: '/(?:\\\\.|[^/])+/i?'
        },
        startConditions: {
            preventPrimitive: 0
        },
        rules: [
            // ignore comments and whitespaces
            ['{comment}', 'yy.commentRanges.push(yylloc.range); /* a comment */'],
            ['{ws}', '/* a whitespace */'],

            // hack to prevent primitive (i.e. regexp and function) consumption
            [['preventPrimitive'], '\\/', 'this.popState(); return "/";'],
            [['preventPrimitive'], '<(?!=)', 'this.popState(); return "<";'],
            // FIXME: using `this.done = false;` is a hack, since `regexp-lexer` set done=true
            // when no input left and doesn't take into account current state;
            // should be fixed in `regexp-lexer`
            [['preventPrimitive'], '', 'this.done = false; this.popState();'],

            // braces
            ['\\(', openScope + 'return "(";'],
            ['\\)', closeScope + switchToPreventPrimitiveState + 'return ")";'],
            ['\\[', openScope + 'return "[";'],
            ['\\]', closeScope + switchToPreventPrimitiveState + 'return "]";'],
            ['\\{', openScope + 'return "{";'],
            ['\\}', closeScope + switchToPreventPrimitiveState + 'return "}";'],

            // keywords (should goes before SYMBOL)
            ['true{wb}', 'return "TRUE";'],
            ['false{wb}', 'return "FALSE";'],
            ['null{wb}', 'return "NULL";'],
            ['undefined{wb}', 'return "UNDEFINED";'],

            // keyword operators (should goes before SYMBOL)
            ['and{wb}', 'return "AND";'],
            ['or{wb}' , 'return "OR";'],
            ['has{ws}no{wb}', 'return "HASNO";'],
            ['has{wb}', 'return "HAS";'],
            ['in{wb}', 'return "IN";'],
            ['not{ws}in{wb}', 'return "NOTIN";'],
            ['not?{wb}', 'return "NOT";'],

            // special vars
            ['@', switchToPreventPrimitiveState + 'return "@";'],
            ['#', switchToPreventPrimitiveState + 'return "#";'],
            ['\\$', switchToPreventPrimitiveState + 'return "$";'],
            ['::self', 'return "SELF";'],

            // primitives
            ['\\d+(?:\\.\\d+)?([eE][-+]?\\d+)?{wb}', switchToPreventPrimitiveState + 'return "NUMBER";'],    // 212.321
            ['"(?:\\\\.|[^"])*"', switchToPreventPrimitiveState + 'return "STRING";'],       // "foo" "with \" escaped"
            ["'(?:\\\\.|[^'])*'", switchToPreventPrimitiveState + 'return "STRING";'],       // 'foo' 'with \' escaped'
            ['{rx}', switchToPreventPrimitiveState + 'return "REGEXP"'],                                              // /foo/i
            ['[a-zA-Z_][a-zA-Z_$0-9]*', switchToPreventPrimitiveState + 'return "SYMBOL";'], // foo123
            ['<(?!=)', 'this.fnOpened++; return "FUNCTION_START"'],

            // operators
            ['=', 'return "=";'],
            ['!=', 'return "!=";'],
            ['~=', 'return "~=";'],
            ['>=', 'return ">=";'],
            ['<=', 'return "<=";'],
            ['<', 'return "<";'],
            ['>', `
                if (this.fnOpened) {
                    this.fnOpened--;
                    return "FUNCTION_END";
                }
                return ">";
            `],
            ['\\.\\.\\(', openScope + 'return "..(";'],
            ['\\.\\(', openScope + 'return ".(";'],
            ['\\.\\[', openScope + 'return ".[";'],
            ['\\.\\.\\.', 'return "...";'],
            ['\\.\\.', switchToPreventPrimitiveState + 'return "..";'],
            ['\\.', switchToPreventPrimitiveState + 'return ".";'],
            ['\\?', 'return "?";'],
            [',', 'return ",";'],
            [':', 'return ":";'],
            [';', 'return ";";'],
            ['\\-', 'return "-";'],
            ['\\+', 'return "+";'],
            ['\\*', 'return "*";'],
            ['\\/', 'return "/";'],
            ['\\%', 'return "%";'],

            // eof
            ['$', 'return "EOF";']
        ]
    },
    // Operator precedence - lowest precedence first.
    // See http://www.gnu.org/software/bison/manual/html_node/Precedence.html
    operators: [
        ['right', '?', ':'],
        ['left', ','],
        ['left', 'OR'],
        ['left', 'AND'],
        ['left', 'NOT'],
        ['left', 'IN', 'NOTIN', 'HAS', 'HASNO'],
        ['left', '=', '!=', '~='],
        ['left', '<', '<=', '>', '>='],
        ['left', '+', '-'],
        ['left', '*', '/', '%'],
        ['left', '.', '..', '...'],
        ['left', '.(', '.[', '..(']
    ],
    // Grammar
    start: 'root',
    bnf: {
        root: [
            ['block EOF', 'return $$ = { ast: $1, commentRanges: yy.commentRanges };']
        ],

        block: [
            ['nonEmptyBlock', code`/*scope*/$1`],
            ['definitions', code`/*scope*/$1\nreturn current`],
            ['', code`/*scope*/return /*@$*/current`]
        ],

        nonEmptyBlock: [
            ['definitions e', code`$1\nreturn $2`],
            ['e', code`return $1`]
        ],

        definitions: [
            ['def', code`$1`],
            ['definitions def', code`$1\n$2`]
        ],

        def: [
            ['$ ;', code`/*key@1*/current;`], // do nothing, but collect stat (suggestions)
            ['$ SYMBOL ;', code`/*define:@2*/const $$2 = fn.map(/*key@2*/current, "$2");`],
            ['$ SYMBOL : e ;', code`/*define:@2*/const $$2 = $4;`]
        ],

        e: [
            ['query', code`$1`],

            ['SELF', code`current => self(current, context)`],
            ['SELF ( )', code`self(current, context)`],
            ['SELF ( e )', code`self($3, context)`],

            ['keyword', code`$1`],
            ['function', code`$1`],
            ['op', code`$1`]
        ],

        op: [
            ['NOT e', code`!fn.bool($2)`],
            ['- e', code`-$2`],
            ['+ e', code`+$2`],
            ['e IN e', code`fn.in($1, /*in-value@1*/$3)`],
            ['e HAS e', code`fn.in($3, /*in-value@3*/$1)`],
            ['e NOTIN e', code`!fn.in($1, $3)`],
            ['e HASNO e', code`!fn.in($3, $1)`],
            ['e AND e', code`fn.bool(tmp = $1) ? $3 : tmp`],
            ['e OR e', code`fn.bool(tmp = $1) ? tmp : $3`],
            ['e ? e : e', code`fn.bool($1) ? $3 : $5`],
            ['e + e', code`fn.add($1, $3)`],
            ['e - e', code`fn.sub($1, $3)`],
            ['e * e', code`fn.mul($1, $3)`],
            ['e / e', code`fn.div($1, $3)`],
            ['e % e', code`fn.mod($1, $3)`],
            ['e = e', code`fn.eq(/*value@3*/$1, $3)`],
            ['e != e', code`fn.ne(/*value@3*/$1, $3)`],
            ['e < e', code`fn.lt($1, $3)`],
            ['e <= e', code`fn.lte($1, $3)`],
            ['e > e', code`fn.gt($1, $3)`],
            ['e >= e', code`fn.gte($1, $3)`],
            ['e ~= e', code`fn.match($1, $3)`]
        ],

        keyword: [
            ['TRUE', code`true`],
            ['FALSE', code`false`],
            ['NULL', code`null`],
            ['UNDEFINED', code`undefined`]
        ],

        query: [
            ['queryRoot', code`$1`],
            ['relativePath', code`$1`]
        ],

        queryRoot: [
            ['@', code`data`],
            ['#', code`context`],
            ['$', code`/*var:@1*/current`],
            ['$ SYMBOL', code`/*var:@$*/typeof $$2 !== 'undefined' ? $$2 : undefined`],
            ['STRING', code`$1`],
            ['NUMBER', code`$1`],
            ['REGEXP', code`$1`],
            ['object', code`$1`],
            ['array', code`$1`],
            ['SYMBOL', code`/*var:@1*/fn.map(/*@1*/current, "$1", 'xxx')`],
            ['. SYMBOL', code`fn.map(/*@2*/current, "$2")`],
            ['( e )', code`($2)`],
            ['.( block )', code`fn.map(current, current => { $2 })`],
            ['SYMBOL ( )', code`method.$1(/*@1/@2*/current)`],
            ['SYMBOL ( arguments )', code`method.$1(/*@1*/current, $3)`],
            ['. SYMBOL ( )', code`method.$2(/*@2/@3*/current)`],
            ['. SYMBOL ( arguments )', code`method.$2(/*@2*/current, $4)`],
            ['.. SYMBOL', code`fn.recursive(/*@2*/current, "$2")`],
            ['..( block )', code`fn.recursive(current, current => { $2 })`],
            ['.[ block ]', code`fn.filter(current, current => { $2 })`]
        ],

        relativePath: [
            ['query . SYMBOL', code`fn.map(/*@3*/$1, "$3")`],
            ['query . SYMBOL ( )', code`method.$3(/*@3/@4*/$1)`],
            ['query . SYMBOL ( arguments )', code`method.$3(/*@3*/$1, $5)`],
            ['query .( block )', code`fn.map($1, current => { $3 })`],
            ['query .. SYMBOL', code`fn.recursive(/*@3*/$1, "$3")`],
            ['query ..( block )', code`fn.recursive($1, current => { $3 })`],
            ['query .[ block ]', code`fn.filter($1, current => { $3 })`],
            ['query [ e ]', code`fn.map($1, $3)`]
        ],

        arguments: [
            ['e', code`$1`],
            ['arguments , e', code`$1, $3`]
        ],

        object: [
            ['{ }', code`(/*@1*/current, {})`],
            ['{ properties }', code`({ $2 })`]
        ],

        properties: [
            ['property', code`$1`],
            ['properties , property', code`$1, $3`]
        ],

        property: [
            ['SYMBOL', code`/*var:@1*/$1: fn.map(/*@1*/current, "$1")`],
            ['$', code`[Symbol()]: /*var:@$*/0`],  // do nothing, but collect stat (suggestions)
            ['$ SYMBOL', code`/*var:@$*/$2: typeof $$2 !== 'undefined' ? $$2 : undefined`],
            ['SYMBOL : e', code`$1: $3`],
            ['STRING : e', code`$1: $3`],
            ['[ e ] : e', code`[$2]: $5`],
            ['...', code`.../*var:@1*//*@1*/current`],
            ['... query', code`...$2`]
        ],

        array: [
            ['[ ]', code`(/*@1*/current, [])`],
            ['[ arrayItems ]', code`[$2]`]
        ],

        arrayItems: [
            ['e', code`$1`],
            ['e , arrayItems', code`$1, $3`]
        ],

        function: [
            ['FUNCTION_START block FUNCTION_END', code`current => { $2 }`]
        ]
    }
};

module.exports = patchParsers(new Parser(grammar));
