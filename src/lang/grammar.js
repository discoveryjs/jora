const { isPlainObject } = require('../utils');
const {
    Arg1,
    Array,
    Binary,
    Block,
    Compare,
    Conditional,
    Context,
    Current,
    Data,
    // Declarator,
    Definition,
    Filter,
    Function,
    GetProperty,
    Identifier,
    Literal,
    Map,
    MapRecursive,
    Method,
    MethodCall,
    Object,
    ObjectEntry,
    Parentheses,
    Pick,
    Pipeline,
    Reference,
    SliceNotation,
    SortingFunction,
    Spread,
    Template,
    Unary
} = require('./nodes').build;
const isArray = [].constructor.isArray;
const keys = {}.constructor.keys;
const $0 = { name: '$0' };
const $1 = { name: '$1' };
const $1name = { name: '$1.name' };
const $$1name = { name: '"$" + $1.name' };
const $2 = { name: '$2' };
const $3 = { name: '$3' };
const $4 = { name: '$4' };
const $5 = { name: '$5' };
const $r0 = { name: '@0.range' };
const $r1 = { name: '@1.range' };
const refs = new Set([$0, $1, $1name, $$1name, $2, $3, $4, $5, $r0, $r1]);
const asis = '';

function stringify(value) {
    switch (typeof value) {
        case 'string':
            return JSON.stringify(value);

        case 'undefined':
        case 'boolean':
        case 'number':
            return String(value);

        case 'object':
            if (value === null) {
                return String(value);
            }

            if (refs.has(value)) {
                return value.name;
            }

            if (value instanceof RegExp) {
                return String(value);
            }

            if (isArray(value)) {
                return '[' + value.map(stringify) + ']';
            }

            return '{' + keys(value).map(k => k + ':' + stringify(value[k])).join(',') + '}';
    }
}

function $$(node) {
    if (isPlainObject(node)) {
        node.range = $r0;
    }

    return '$$ = ' + stringify(node);
}

// FIXME: temporary solution, because of `declarator` conflict
// with `queryRule` when declarator specified aside
function Declarator_(name) {
    return {
        type: 'Declarator',
        name,
        range: $r1
    };
}

function createCommaList(name, element) {
    return [
        [`${element}`, $$([$1])],
        [`${name} , ${element}`, '$1.push($3)']
    ];
}

const templateToken = (input, state) => {
    if (input[0] !== (state === 'template' ? '}' : '`')) {
        return null;
    }

    for (let i = 1; i < input.length; i++) {
        if (input[i] === '`') {
            return i + 1;
        }

        if (input[i] === '$' && input[i + 1] === '{') {
            return i + 2;
        }

        if (input[i] === '\\') {
            i++;
        }
    }

    return null;
};

module.exports = {
    // Lexical tokens
    lex: {
        options: {
            ranges: true
        },
        macros: {
            wb: '\\b',
            ows: '\\s*',  // optional whitespaces
            ws: '\\s+',   // required whitespaces
            comment: '//.*?(?:\\n|\\r\\n?|\\u2028|\\u2029|$)|/\\*(?:.|\\s)*?(?:\\*/|$)',
            ident: '(?:[a-zA-Z_]|\\\\u[0-9a-fA-F]{4})(?:[a-zA-Z_$0-9]|\\\\u[0-9a-fA-F]{4})*',
            rx: '/(?:\\\\.|[^/])+/i?'
        },
        startConditions: {
            preventPrimitive: 0,
            template: 1
        },
        rules: [
            // ignore comments and whitespaces
            ['{comment}', 'yy.commentRanges.push(yylloc.range)'],
            ['{ws}', ''],

            // hack to prevent primitive (i.e. regexp and function) consumption
            [['preventPrimitive'], '\\/', 'this.popState(); return "/";'],
            [['preventPrimitive'], '<(?!=)', 'this.popState(); return "<";'],
            // FIXME: using `this.done = false;` is a hack, since `regexp-lexer` set done=true
            // when no input left and doesn't take into account current state;
            // should be fixed in `regexp-lexer`
            [['preventPrimitive'], '', () => {
                this.done = false;
                this.popState();
            }],

            // template
            [templateToken, (yy, yytext) => {
                const token = yytext.endsWith('`') ? 'TEMPLATE' : 'TPL_START';
                yytext = this.toStringLiteral(yytext, true, 1 + (token !== 'TEMPLATE'));
                if (token === 'TEMPLATE') {
                    yy.pps();
                }
                return token;
            }],
            [['template'], templateToken, (yy, yytext) => {
                const token = yytext.endsWith('`') ? 'TPL_END' : 'TPL_CONTINUE';
                yytext = this.toStringLiteral(yytext, true, 1 + (token !== 'TPL_END'));
                this.popState();
                if (token === 'TPL_END') {
                    yy.pps();
                }
                return token;
            }],
            [['template'], '', () => this.parseError('Unexpected end of input')],

            // braces
            ['\\(', 'return "(";'],
            ['\\)', 'yy.pps(); return ")";'],
            ['\\[', 'return "[";'],
            ['\\]', 'yy.pps(); return "]";'],
            ['\\{', 'return "{";'],
            ['\\}', (yy) => {
                if (this.bracketStack[this.bracketStack.length - 1] !== 'TPL_END') {
                    yy.pps();
                    return '}';
                }

                this.unput('}');
                this.begin('template');
            }],

            // keywords (should goes before ident)
            // eslint-disable-next-line no-unused-vars
            ['(true|false|null|undefined|Infinity|NaN){wb}', (yytext) => {
                yytext = this.toLiteral(yytext);
                return 'LITERAL';
            }],

            // keyword operators (should goes before IDENT)
            ['and{wb}', 'return "AND";'],
            ['or{wb}' , 'return "OR";'],
            ['has{ws}no{wb}', 'return "HASNO";'],
            ['has{wb}', 'return "HAS";'],
            ['in{wb}', 'return "IN";'],
            ['not{ws}in{wb}', 'return "NOTIN";'],
            ['not?{wb}', 'return "NOT";'],
            ['(asc|desc)(NA?|AN?)?{wb}', 'return "ORDER";'],

            // primitives
            ['(\\d+\\.|\\.)?\\d+([eE][-+]?\\d+)?{wb}', 'yy.pps(); yytext = Number(yytext); return "NUMBER";'],  // 212.321
            ['0[xX][0-9a-fA-F]+', 'yy.pps(); yytext = parseInt(yytext, 16); return "NUMBER";'],  // 0x12ab
            ['"(?:\\\\[\\\\"]|[^"])*"', 'yy.pps(); yytext = this.toStringLiteral(yytext); return "STRING";'],   // "foo" "with \" escaped"
            ["'(?:\\\\[\\\\']|[^'])*'", 'yy.pps(); yytext = this.toStringLiteral(yytext); return "STRING";'],   // 'foo' 'with \' escaped'
            ['{rx}', 'yy.pps(); yytext = this.toRegExp(yytext); return "REGEXP";'], // /foo/i
            ['{ident}', 'yy.pps(); yytext = this.ident(yytext); return "IDENT";'], // foo123
            ['\\${ident}', 'yy.pps(); yytext = this.ident(yytext.slice(1)); return "$IDENT";'], // $foo123

            // special vars
            ['@', 'yy.pps(); return "@";'],
            ['#', 'yy.pps(); return "#";'],
            ['\\$\\$', 'yy.pps(); return "$$";'],
            ['\\$', 'yy.pps(); return "$";'],

            // functions
            ['=>', 'return "FUNCTION";'],
            ['<(?!=)', () => {
                this.fnOpened++;
                return 'FUNCTION_START';
            }],

            // operators
            ['=', 'return "=";'],
            ['!=', 'return "!=";'],
            ['~=', 'return "~=";'],
            ['>=', 'return ">=";'],
            ['<=', 'return "<=";'],
            ['<', 'return "<";'],
            ['>', () => {
                if (this.fnOpened) {
                    this.fnOpened--;
                    return 'FUNCTION_END';
                }
                return '>';
            }],
            ['\\.\\.\\(', 'return "..(";'],
            ['\\.\\(', 'return ".(";'],
            ['\\.\\[', 'return ".[";'],
            ['\\.\\.\\.', 'return "...";'],
            ['\\.\\.', 'yy.pps(); return "..";'],
            ['\\.', 'yy.pps(); return ".";'],
            ['\\?', 'return "?";'],
            [',', 'return ",";'],
            [':', 'return ":";'],
            [';', 'return ";";'],
            ['\\-', 'return "-";'],
            ['\\+', 'return "+";'],
            ['\\*', 'return "*";'],
            ['\\/', 'return "/";'],
            ['\\%', 'return "%";'],
            ['\\|', 'return "|";'],

            // eof
            ['$', 'return "EOF";']
        ]
    },

    // Binary precedence - lowest precedence first.
    // See http://www.gnu.org/software/bison/manual/html_node/Precedence.html
    operators: [
        ['left', '|'],
        ['left', 'def'],
        ['left', ';'],
        ['left', 'FUNCTION'],
        ['left', 'sortingCompareList', 'sortingCompare'],
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
            ['block EOF', 'return yy.buildResult($1)']
        ],

        block: [
            ['definitions e', $$(Block($1, $2))],
            ['definitions', $$(Block($1, null))],
            ['e', $$(Block([], $1))],
            ['', $$(Block([], null))]
        ],
        definitions: [
            ['def', $$([$1])],
            ['definitions def', '$1.push($2)']
        ],
        def: [
            ['$ ;', $$(Definition(Declarator_(null), null))],     // declare nothing, but avoid failure and capture stat (suggestions)
            ['$ : e ;', $$(Definition(Declarator_(null), $3))],   // declare nothing, but avoid failure and capture stat (suggestions)
            ['$ident ;', $$(Definition(Declarator_($1name), null))],
            ['$ident : e ;', $$(Definition(Declarator_($1name), $3))]
        ],
        // FIXME: temporary solution, because of `declarator` conflict
        // with `queryRule` when declarator specified aside
        // declarator: [
        //     ['$', $$(Declarator(null))], // declare nothing, but avoid failure and capture stat (suggestions)
        //     ['$ident', $$(Declarator($1))]
        // ],

        ident: [
            ['IDENT', $$(Identifier($1))]
        ],
        $ident: [
            ['$IDENT', $$(Identifier($1))]
        ],

        e: [
            ['query', asis],

            // functions
            ['FUNCTION_START block FUNCTION_END', $$(Function([], $2, true))],
            ['FUNCTION e', $$(Function([], $2))],
            ['sortingCompareList', $$(SortingFunction($1))],

            // pipeline
            ['e | e', $$(Pipeline($1, $3))],
            ['e | definitions e', $$(Pipeline($1, Block($3, $4)))],

            // unary operators
            ['NOT e', $$(Unary($1, $2))],
            ['- e', $$(Unary($1, $2))],
            ['+ e', $$(Unary($1, $2))],

            // binary operators
            ['e IN e', $$(Binary($2, $1, $3))],
            ['e HAS e', $$(Binary($2, $1, $3))],
            ['e NOTIN e', $$(Binary($2, $1, $3))],
            ['e HASNO e', $$(Binary($2, $1, $3))],
            ['e AND e', $$(Binary($2, $1, $3))],
            ['e OR e', $$(Binary($2, $1, $3))],
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
            ['e ~= e', $$(Binary($2, $1, $3))],

            // conditional
            ['e ? e : e', $$(Conditional($1, $3, $5))]
        ],

        query: [
            ['queryRoot', asis],
            ['relativePath', asis]
        ],
        queryRoot: [
            ['@', $$(Data())],
            ['#', $$(Context())],
            ['$', $$(Current()), { prec: 'def' }],
            ['$$', $$(Arg1())],
            ['$ident', $$(Reference($1)), { prec: 'def' }],
            ['STRING', $$(Literal($1))],
            ['NUMBER', $$(Literal($1))],
            ['REGEXP', $$(Literal($1))],
            ['LITERAL', $$(Literal($1))],
            ['template', $$(Template($1))],
            ['object', asis],
            ['array', asis],
            ['[ sliceNotation ]', $$(SliceNotation(null, $2))],
            ['ident', $$(GetProperty(null, $1))],
            ['method()', $$(MethodCall(null, $1))],
            ['( e )', $$(Parentheses($2))], // NOTE: using e instead of block for preventing a callback creation
            ['( definitions e )', $$(Parentheses(Block($2, $3)))],
            ['. ident', $$(GetProperty(null, $2))],
            ['. method()', $$(MethodCall(null, $2))],
            ['.( block )', $$(Map(null, $2))],
            ['.[ block ]', $$(Filter(null, $2))],
            ['.. ident', $$(MapRecursive(null, GetProperty(null, $2)))],
            ['.. method()', $$(MapRecursive(null, MethodCall(null, $2)))],
            ['..( block )', $$(MapRecursive(null, $2))]
        ],
        relativePath: [
            ['query [ ]', $$(Pick($1, null))],
            ['query [ e ]', $$(Pick($1, $3))],
            ['query [ sliceNotation ]', $$(SliceNotation($1, $3))],
            ['query . ident', $$(GetProperty($1, $3))],
            ['query . method()', $$(MethodCall($1, $3))],
            ['query .( block )', $$(Map($1, $3))],
            ['query .[ block ]', $$(Filter($1, $3))],
            ['query .. ident', $$(MapRecursive($1, GetProperty(null, $3)))],
            ['query .. method()', $$(MapRecursive($1, MethodCall(null, $3)))],
            ['query ..( block )', $$(MapRecursive($1, $3))]
        ],

        'method()': [
            ['ident ( )', $$(Method($1, []))],
            ['ident ( arguments )', $$(Method($1, $3))],
            ['$ident ( )', $$(Method(Reference($1), []))],
            ['$ident ( arguments )', $$(Method(Reference($1), $3))]
        ],
        arguments: createCommaList('arguments', 'e'),

        template: [
            ['templateString', $$([$1])],
            ['templateStart templateTail', '$$=[$1, ...$2]']
        ],
        templateTail: [
            ['templateEnd', $$([null, $1])],
            ['e templateEnd', $$([$1, $2])],
            ['templateContinue templateTail', '$$=[null, $1, ...$2]'],
            ['e templateContinue templateTail', '$$=[$1, $2, ...$3]']
        ],
        templateString: [['TEMPLATE', $$(Literal($1))]],
        templateStart: [['TPL_START', $$(Literal($1))]],
        templateContinue: [['TPL_CONTINUE', $$(Literal($1))]],
        templateEnd: [['TPL_END', $$(Literal($1))]],

        object: [
            ['{ }', $$(Object([]))],
            ['{ properties }', $$(Object($2))],
            ['{ properties , }', $$(Object($2))],
            ['{ definitions }', $$(Object([]))],
            ['{ definitions properties }', $$(Block($2, Object($3)))],
            ['{ definitions properties , }', $$(Block($2, Object($3)))]
        ],
        properties: createCommaList('properties', 'property'),
        property: [
            ['$', $$(ObjectEntry(Current(), null))],  // do nothing, but collect stat (suggestions)
            ['$ident', $$(ObjectEntry(Reference($1), null))],
            ['ident', $$(ObjectEntry($1, null))],
            ['ident : e', $$(ObjectEntry($1, $3))],
            ['STRING : e', $$(ObjectEntry(Literal($1), $3))],
            ['NUMBER : e', $$(ObjectEntry(Literal($1), $3))],
            ['LITERAL : e', $$(ObjectEntry(Literal($1), $3))],
            ['$ident : e', $$(ObjectEntry(Identifier($$1name), $3))],
            ['[ e ] : e', $$(ObjectEntry($2, $5))],
            ['...', $$(Spread(null))],
            ['... query', $$(Spread($2))]
        ],

        arrayElements: createCommaList('arrayElements', 'arrayElement'),
        arrayElement: [
            ['e', asis],
            ['...', $$(Spread(null, true))],
            ['... e', $$(Spread($2, true))]
        ],
        array: [
            ['[ ]', $$(Array([]))],
            ['[ arrayElements ]', $$(Array($2))],
            ['[ arrayElements , ]', $$(Array($2))]
        ],

        sortingCompareList: createCommaList('sortingCompareList', 'sortingCompare'),
        sortingCompare: [
            ['query ORDER', $$(Compare($1, $2))]
        ],

        sliceNotation: [
            ['sliceNotationComponent', $$([null, $1])],
            ['sliceNotationComponent sliceNotationComponent', $$([null, $1, $2])],
            ['e sliceNotationComponent', $$([$1, $2])],
            ['e sliceNotationComponent sliceNotationComponent', $$([$1, $2, $3])]
        ],
        sliceNotationComponent: [
            [':', $$(null)],
            [': e', $$($2)]
        ]
    }
};
