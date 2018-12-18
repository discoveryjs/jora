const Jison = require('jison');

function code(s) {
    return '$$ = [' +
        s[0].split(/(\$\d+)/g).map((x, i) => i % 2 ? x : JSON.stringify(x)) +
    '];';
}

var grammar = {
    // Lexical tokens
    lex: {
        macros: {
            wb: '\\b',
            ows: '\\s*',  // optional whitespaces
            ws: '\\s+'    // required whitespaces
        },
        rules: [
            ['\\({ows}', 'return "(";'],
            ['{ows}\\)', 'return ")";'],
            ['{ows}\\[{ows}', 'return "[";'],
            ['{ows}\\]', 'return "]";'],
            ['\\{{ows}', 'return "{";'],
            ['{ows}\\}', 'return "}";'],

            ['{ows}={ows}', 'return "=";'],
            ['{ows}!={ows}', 'return "!=";'],
            ['{ows}~={ows}', 'return "~=";'],
            ['{ows}>={ows}', 'return ">=";'],
            ['{ows}<={ows}', 'return "<=";'],
            ['{ows}<{ows}', 'return "<";'],
            ['{ows}>{ows}', 'return ">";'],
            ['{ws}and{ws}', 'return "AND";'],
            ['{ws}or{ws}' , 'return "OR";'],
            ['{ws}in{ws}', 'return "IN";'],
            ['{ws}not{ws}in{ws}', 'return "NOTIN";'],
            ['not?{ws}', 'return "NOT";'],

            ['{wb}true{wb}', 'return "TRUE";'],
            ['{wb}false{wb}', 'return "FALSE";'],
            ['{wb}null{wb}', 'return "NULL";'],
            ['{wb}undefined{wb}', 'return "UNDEFINED";'],

            ['::self', 'return "SELF";'],
            ['[0-9]+(?:\\.[0-9]+)?\\b', 'return "NUMBER";'], // 212.321
            ['"(?:\\\\.|[^"])*"', 'return "STRING";'],       // "foo" "with \" escaped"
            ["'(?:\\\\.|[^'])*'", 'return "STRING";'],       // 'foo' 'with \' escaped'
            ['/(?:\\\\.|[^/])+/i?', 'return "REGEXP"'],      // /foo/i
            ['[a-zA-Z_][a-zA-Z_$0-9]*', 'return "SYMBOL";'], // foo123

            // comment
            ['{ows}//.*?(\\n|$)', '/* a comment */'],

            ['{ows}\\.\\.\\({ows}', 'return "..(";'],
            ['{ows}\\.\\({ows}', 'return ".(";'],
            ['{ows}\\.\\[{ows}', 'return ".[";'],
            ['{ows}\\.{1,3}', 'return yytext.trim();'],
            ['{ows}\\?{ows}', 'return "?";'],
            ['{ows},{ows}', 'return ",";'],
            ['{ows}:{ows}', 'return ":";'],
            ['{ows};{ows}', 'return ";";'],
            ['{ows}\\-{ows}', 'return "-";'],
            ['{ows}\\+{ows}', 'return "+";'],
            ['{ows}\\*{ows}', 'return "*";'],
            ['{ows}\\/{ows}', 'return "/";'],
            ['{ows}\\%{ows}', 'return "%";'],
            // ['{ows}\\^{ows}', 'return "%";'],
            ['@', 'return "@";'],
            ['#', 'return "#";'],
            ['\\$', 'return "$";'],

            // end
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
        ['left', 'IN', 'NOTIN'],
        ['left', '=', '!=', '~='],
        ['left', '<', '<=', '>', '>='],
        ['left', '+', '-'],
        ['left', '*', '/', '%'],
        // ['left', '^'],
        ['left', '.', '..', '...'],
        ['left', '.(', '.[', '..(']
    ],
    // Grammar
    start: 'root',
    bnf: {
        root: [
            ['block EOF', 'return $$ = $1;']
        ],

        nonEmptyBlock: [
            ['definitions e', code`$1\nreturn $2`],
            ['e', code`return $1`]
        ],

        block: [
            ['nonEmptyBlock', code`$1`],
            ['definitions', code`$1\nreturn current`],
            ['', code`return current`]
        ],

        definitions: [
            ['def', code`$1`],
            ['definitions def', code`$1\n$2`]
        ],

        def: [
            ['$ SYMBOL ;', code`const $$2 = fn.get(current, "$2");`],
            ['$ SYMBOL : e ;', code`const $$2 = $4;`]
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
            ['e IN e', code`fn.in($1, $3)`],
            ['e NOTIN e', code`!fn.in($1, $3)`],
            ['e AND e', code`fn.bool($1) ? $3 : $1`],
            ['e OR e', code`fn.bool($1) ? $1 : $3`],
            ['e ? e : e', code`fn.bool($1) ? $3 : $5`],
            ['e + e', code`fn.add($1, $3)`],
            ['e - e', code`fn.sub($1, $3)`],
            ['e * e', code`fn.mul($1, $3)`],
            ['e / e', code`fn.div($1, $3)`],
            ['e % e', code`fn.mod($1, $3)`],
            ['e = e', code`fn.eq($1, $3)`],
            ['e != e', code`fn.ne($1, $3)`],
            ['e < e', code`fn.lt($1, $3)`],
            ['e <= e', code`fn.lte($1, $3)`],
            ['e > e', code`fn.gt($1, $3)`],
            ['e >= e', code`fn.gte($1, $3)`],
            ['e ~= e', code`fn.regexp($1, $3)`]
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
            ['$', code`current`],
            ['$ SYMBOL', code`$$2`],
            ['STRING', code`$1`],
            ['NUMBER', code`$1`],
            ['REGEXP', code`$1`],
            ['object', code`$1`],
            ['array', code`$1`],
            ['SYMBOL', code`fn.get(current, "$1")`],
            ['. SYMBOL', code`fn.get(current, "$2")`],
            ['( e )', code`($2)`],
            ['.( block )', code`fn.get(current, current => { $2 })`],
            ['SYMBOL ( arguments )', code`method.$1(current$3)`],
            ['. SYMBOL ( arguments )', code`method.$2(current$4)`],
            ['.. SYMBOL', code`fn.recursive(current, "$2")`],
            ['..( block )', code`fn.recursive(current, current => { $2 })`],
            ['.[ block ]', code`fn.filter(current, current => { $2 })`]
        ],

        relativePath: [
            ['query . SYMBOL', code`fn.get($1, "$3")`],
            ['query . SYMBOL ( arguments )', code`method.$3($1$5)`],
            ['query .( block )', code`fn.get($1, current => { $3 })`],
            ['query .. SYMBOL', code`fn.recursive($1, "$3")`],
            ['query ..( block )', code`fn.recursive($1, current => { $3 })`],
            ['query .[ block ]', code`fn.filter($1, current => { $3 })`],
            ['query [ e ]', code`fn.get($1, $3)`]
        ],

        arguments: [
            ['', code``],
            ['argumentList', code`$1`]
        ],

        argumentList: [
            ['e', code`, $1`],
            ['argumentList , e', code`$1, $3`]
        ],

        object: [
            ['{ }', code`({})`],
            ['{ properties }', code`({ $2 })`]
        ],

        properties: [
            ['property', code`$1`],
            ['properties , property', code`$1, $3`]
        ],

        property: [
            ['SYMBOL', code`$1: fn.get(current, "$1")`],
            ['$ SYMBOL', code`$2: $$2`],
            ['SYMBOL : e', code`$1: $3`],
            ['[ e ] : e', code`[$2]: $5`],
            ['...', code`...current`],
            ['... query', code`...$2`]
        ],

        array: [
            ['[ ]', code`[]`],
            ['[ arrayItems ]', code`[$2]`]
        ],

        arrayItems: [
            ['e', code`$1`],
            ['e , arrayItems', code`$1, $3`]
        ],

        function: [
            ['< e >', code`current => $2`]
        ]
    }
};

module.exports = new Jison.Parser(grammar);
