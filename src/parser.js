const { Parser } = require('jison');
const patchParsers = require('./parser-patch');

const $1 = '$1';
const $2 = '$2';
const $3 = '$3';
const $4 = '$4';
const $5 = '$5';
const asis = '';

function $$(s) {
    return '$$ = ' + JSON.stringify(s).replace(/:"(\$\d+)"/g, ':$1').replace(/\}$/, ',range:@0.range}');
}

function Data() {
    return {
        type: 'Data'
    };
}

function Context() {
    return {
        type: 'Context'
    };
}

function Current() {
    return {
        type: 'Current'
    };
}

function Literal(value) {
    return {
        type: 'Literal',
        value
    };
}

function Unary(operator, argument) {
    return {
        type: 'Unary',
        operator,
        argument
    };
}

function Binary(operator, left, right) {
    return {
        type: 'Binary',
        operator,
        left,
        right
    };
}

function Conditional(test, consequent, alternate) {
    return {
        type: 'Conditional',
        test,
        consequent,
        alternate
    };
}

function Object(properties) {
    return {
        type: 'Object',
        properties
    };
}

function Property(key, value) {
    return {
        type: 'Property',
        key,
        value
    };
}

function Spread(query) {
    return {
        type: 'Spread',
        query
    };
}

function Array(elements) {
    return {
        type: 'Array',
        elements
    };
}

function Function(arguments, body) {
    return {
        type: 'Function',
        arguments,
        body
    };
}

function Compare(query, reverse) {
    return {
        type: 'Compare',
        query,
        reverse
    };
}

function SortingFunction(compares) {
    return {
        type: 'SortingFunction',
        compares
    };
}

function MethodCall(value, method, arguments) {
    return {
        type: 'MethodCall',
        value,
        method,
        arguments
    };
}

function Definition(name, value) {
    return {
        type: 'Definition',
        name,
        value
    };
}

function Block(definitions, body) {
    return {
        type: 'Block',
        definitions,
        body
    };
}

function Parentheses(body) {
    return {
        type: 'Parentheses',
        body
    };
}

function Reference(name) {
    return {
        type: 'Reference',
        name
    };
}

function Identifier(name) {
    return {
        type: 'Identifier',
        name
    };
}

function Map(value, query) {
    return {
        type: 'Map',
        value,
        query
    };
}

function Filter(value, query) {
    return {
        type: 'Filter',
        value,
        query
    };
}

function Recursive(value, query) {
    return {
        type: 'Recursive',
        value,
        query
    };
}

function GetProperty(value, property) {
    return {
        type: 'GetProperty',
        value,
        property
    };
}

function createCommaList(name, element) {
    return [
        [`${element}`, '$$=[$1]'],
        [`${name} , ${element}`, '$1.push($3)']
    ];
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

            // keywords (should goes before ident)
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
            ['asc{wb}', 'return "ASC";'],
            ['desc{wb}', 'return "DESC";'],

            // special vars
            ['@', switchToPreventPrimitiveState + 'return "@";'],
            ['#', switchToPreventPrimitiveState + 'return "#";'],
            ['\\$', switchToPreventPrimitiveState + 'return "$";'],
            ['::self', 'return "SELF";'],

            // primitives
            ['\\d+(?:\\.\\d+)?([eE][-+]?\\d+)?{wb}', switchToPreventPrimitiveState + 'yytext = Number(yytext);return "NUMBER";'],  // 212.321
            ['"(?:\\\\.|[^"])*"', switchToPreventPrimitiveState + 'yytext = JSON.parse(yytext);return "STRING";'],       // "foo" "with \" escaped"
            ["'(?:\\\\.|[^'])*'", switchToPreventPrimitiveState + 'yytext = JSON.parse(yytext);return "STRING";'],       // 'foo' 'with \' escaped'
            ['[a-zA-Z_][a-zA-Z_$0-9]*', switchToPreventPrimitiveState + 'return "SYMBOL";'], // foo123
            ['{rx}', switchToPreventPrimitiveState +
                'yytext = new RegExp(yytext.substr(1, yytext.lastIndexOf("/") - 1), yytext.substr(yytext.lastIndexOf("/") + 1));' +
                'return "REGEXP"'], // /foo/i

            // functions
            ['=>', 'return "FUNCTION";'],
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
    // Binary precedence - lowest precedence first.
    // See http://www.gnu.org/software/bison/manual/html_node/Precedence.html
    operators: [
        ['left', 'FUNCTION'],
        ['right', '?', ':'],
        ['left', 'sortingCompareList', 'sortingCompare'],
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
            ['nonEmptyBlock', asis],
            ['definitions', $$(Block($1, null))],
            ['', $$(Block([], null))]
        ],

        nonEmptyBlock: [
            ['definitions e', $$(Block($1, $2))],
            ['e', $$(Block([], $1))]
        ],

        definitions: [
            ['def', '$$=[$1]'],
            ['definitions def', '$1.push($2)']
        ],

        def: [
            ['$ ;', $$(Definition(null, Current()))], // do nothing, but collect stat (suggestions)
            ['$ ident ;', $$(Definition($2, GetProperty(Current(), $2)))],
            ['$ ident : e ;', $$(Definition($2, $4))]
        ],

        e: [
            ['query', asis],

            // ['SELF', code`current => self(current, context)`],
            // ['SELF ( )', code`self(current, context)`],
            // ['SELF ( e )', code`self($3, context)`],

            ['keyword', asis],
            ['function', asis],
            ['sortingFunction', asis],
            ['op', asis]
        ],

        op: [
            ['NOT e', $$(Unary('not', $2))],
            ['- e', $$(Unary('-', $2))],
            ['+ e', $$(Unary('+', $2))],
            ['e IN e', $$(Binary($2, $1, $3))],
            ['e HAS e', $$(Binary($2, $1, $3))],
            ['e NOTIN e', $$(Binary($2, $1, $3))],
            ['e HASNO e', $$(Binary($2, $1, $3))],
            ['e AND e', $$(Binary($2, $1, $3))],
            ['e OR e', $$(Binary($2, $1, $3))],
            ['e ? e : e', $$(Conditional($1, $3, $5))],
            ['e + e', $$(Binary($2, $1, $3))],
            ['e - e', $$(Binary($2, $1, $3))],
            ['e * e', $$(Binary($2, $1, $3))],
            ['e / e', $$(Binary($2, $1, $3))],
            ['e % e', $$(Binary($2, $1, $3))],
            ['e = e', $$(Binary($2, $1, $3))],
            ['e != e', $$(Binary($2, $1, $3))],
            ['e < e', $$(Binary($2, $1, $3))],
            ['e <= e', $$(Binary($2, $1, $3))],
            ['e > e', $$(Binary($2, $1, $3))],
            ['e >= e', $$(Binary($2, $1, $3))],
            ['e ~= e', $$(Binary($2, $1, $3))]
        ],

        ident: [
            ['SYMBOL', $$(Identifier($1))]
        ],

        keyword: [
            ['TRUE', $$(Literal(true))],
            ['FALSE', $$(Literal(false))],
            ['NULL', $$(Literal(null))],
            ['UNDEFINED', $$(Literal(undefined))]
        ],

        query: [
            ['queryRoot', asis],
            ['relativePath', asis]
        ],

        queryRoot: [
            ['@', $$(Data())],
            ['#', $$(Context())],
            ['$', $$(Current())],
            ['$ ident', $$(Reference($2))],
            ['STRING', $$(Literal($1))],
            ['NUMBER', $$(Literal($1))],
            ['REGEXP', $$(Literal($1))],
            ['object', asis],
            ['array', asis],
            ['ident', $$(GetProperty(Current(), $1))],
            ['ident ( )', $$(MethodCall(Current(), $1, []))],
            ['ident ( arguments )', $$(MethodCall(Current(), $1, $3))],
            ['( e )', $$(Parentheses($2))], // NOTE: using e instead of block for preventing a callback creation
            ['( definitions e )', $$(Parentheses(Block($2, $3)))],
            ['. ident', $$(GetProperty(Current(), $2))],
            ['. ident ( )', $$(MethodCall(Current(), $2, []))],
            ['. ident ( arguments )', $$(MethodCall(Current(), $2, $4))],
            ['.( block )', $$(Map(Current(), $2))],
            ['.[ block ]', $$(Filter(Current(), $2))],
            ['.. ident', $$(Recursive(Current(), GetProperty(Current(), $2)))],
            ['.. ident ( )', $$(Recursive(Current(), MethodCall(Current(), $2, [])))],
            ['.. ident ( arguments )', $$(Recursive(Current(), MethodCall(Current(), $2, $4)))],
            ['..( block )', $$(Recursive(Current(), $2))]
        ],

        relativePath: [
            ['query [ e ]', $$(GetProperty($1, $3))],
            ['query . ident', $$(GetProperty($1, $3))],
            ['query . ident ( )', $$(MethodCall($1, $3, []))],
            ['query . ident ( arguments )', $$(MethodCall($1, $3, $5))],
            ['query .( block )', $$(Map($1, $3))],
            ['query .[ block ]', $$(Filter($1, $3))],
            ['query .. ident', $$(Recursive($1, GetProperty(Current(), $3)))],
            ['query .. ident ( )', $$(Recursive($1, MethodCall(Current(), $3, [])))],
            ['query .. ident ( arguments )', $$(Recursive($1, MethodCall(Current(), $3, $5)))],
            ['query ..( block )', $$(Recursive($1, $3))]
        ],

        arguments: createCommaList('arguments', 'e'),

        object: [
            ['{ }', $$(Object([]))],
            ['{ properties }', $$(Object($2))]
        ],

        properties: createCommaList('properties', 'property'),

        property: [
            ['ident', $$(Property($1, GetProperty(Current(), $1)))],
            ['$', $$(Property(null, Current()))],  // do nothing, but collect stat (suggestions)
            ['$ ident', $$(Property($2, Reference($2)))],
            ['ident : e', $$(Property($1, $3))],
            ['STRING : e', $$(Property(Literal($1), $3))],
            ['[ e ] : e', $$(Property($2, $5))],
            ['...', $$(Spread(Current()))],
            ['... query', $$(Spread($2))]
        ],

        array: [
            ['[ ]', $$(Array([]))],
            ['[ arrayItems ]', $$(Array($2))]
        ],

        arrayItems: createCommaList('arrayItems', 'e'),

        function: [
            ['FUNCTION_START block FUNCTION_END', $$(Function([], $2))],
            ['FUNCTION e', $$(Function([], $2))] // TODO: e -> nonEmptyBlock
        ],

        sortingFunction: [
            ['sortingCompareList', $$(SortingFunction($1))]
        ],

        sortingCompareList: createCommaList('sortingCompareList', 'sortingCompare'),

        sortingCompare: [
            ['query ASC', $$(Compare($1, false))],
            ['query DESC', $$(Compare($1, true))]
        ]
    }
};

module.exports = patchParsers(new Parser(grammar));
