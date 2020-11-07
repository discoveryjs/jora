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
    Parentheses,
    Pick,
    Pipeline,
    ObjectEntry,
    Reference,
    SliceNotation,
    SortingFunction,
    Spread,
    Unary
} = require('./nodes').build;
const isArray = [].constructor.isArray;
const keys = {}.constructor.keys;
const $0 = { name: '$0' };
const $1 = { name: '$1' };
const $1name = { name: '$1.name' };
const $2 = { name: '$2' };
const $3 = { name: '$3' };
const $4 = { name: '$4' };
const $5 = { name: '$5' };
const $r0 = { name: '@0.range' };
const $r1 = { name: '@1.range' };
const refs = new Set([$0, $1, $1name, $2, $3, $4, $5, $r0, $r1]);
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

const switchToPreventPrimitiveState = 'if (this._input) this.begin("preventPrimitive"); ';
const openScope = 'this.fnOpenedStack.push(this.fnOpened); this.fnOpened = 0; ';
const closeScope = 'this.fnOpened = this.fnOpenedStack.pop() || 0; ';

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
            ['(true|false|null|undefined|Infinity|NaN){wb}', 'yytext = this.toLiteral(yytext);return "LITERAL";'],

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
            ['(\\d+\\.|\\.)?\\d+([eE][-+]?\\d+)?{wb}', switchToPreventPrimitiveState + 'yytext = Number(yytext); return "NUMBER";'],  // 212.321
            ['0[xX][0-9a-fA-F]+', switchToPreventPrimitiveState + 'yytext = parseInt(yytext, 16); return "NUMBER";'],  // 0x12ab
            ['"(?:\\\\"|[^"])*"', switchToPreventPrimitiveState + 'yytext = this.toStringLiteral(yytext); return "STRING";'],       // "foo" "with \" escaped"
            ["'(?:\\\\'|[^'])*'", switchToPreventPrimitiveState + 'yytext = this.toStringLiteral(yytext); return "STRING";'],       // 'foo' 'with \' escaped'
            ['{rx}', switchToPreventPrimitiveState + 'yytext = this.toRegExp(yytext); return "REGEXP";'], // /foo/i
            ['{ident}', switchToPreventPrimitiveState + 'yytext = this.ident(yytext); return "IDENT";'], // foo123
            ['\\${ident}', switchToPreventPrimitiveState + 'yytext = this.ident(yytext.slice(1)); return "$IDENT";'], // $foo123

            // special vars
            ['@', switchToPreventPrimitiveState + 'return "@";'],
            ['#', switchToPreventPrimitiveState + 'return "#";'],
            ['\\${2}', switchToPreventPrimitiveState + 'return "$$";'],
            ['\\$', switchToPreventPrimitiveState + 'return "$";'],

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
            ['$ident : e', $$(ObjectEntry($1, $3))],
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
