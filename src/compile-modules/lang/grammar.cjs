const {
    Arg1,
    Array: ArrayNode,
    Binary,
    Block,
    Compare,
    CompareFunction,
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
    Object: ObjectNode,
    ObjectEntry,
    Parentheses,
    Pick,
    Pipeline,
    Placeholder,
    Reference,
    SliceNotation,
    Spread,
    Template,
    Unary
} = require('./nodes.cjs');
const $0 = { code: '$0' };
const $1 = { code: '$1' };
const $1name = { code: '$1.name' };
const $$1name = { code: '"$" + $1.name' };
const $2 = { code: '$2' };
const $3 = { code: '$3' };
const $4 = { code: '$4' };
const $5 = { code: '$5' };
const $r0 = { code: '@0.range' };
const $r1 = { code: '@1.range' };
const $rr = { code: '[@1.range[1],@1.range[1]]' };
const $placeholder = { code: { ...Placeholder(), range: $rr } };
const refs = new Set([$0, $1, $1name, $$1name, $2, $3, $4, $5, $r0, $r1, $rr, $placeholder]);
const asis = '';

function isPlainObject(value) {
    return value !== null && typeof value === 'object' && value.constructor === Object;
}

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
                return typeof value.code === 'string' ? value.code : stringify(value.code);
            }

            if (value instanceof RegExp) {
                return String(value);
            }

            if (Array.isArray(value)) {
                return '[' + value.map(stringify) + ']';
            }

            return '{' + Object.keys(value).map(k => k + ':' + stringify(value[k])).join(',') + '}';
    }
}

function $$(node) {
    if (isPlainObject(node)) {
        node.range = $r0;
    }

    return '$$ = ' + stringify(node);
}

// FIXME: temporary solution, because of `declarator` is conflicting
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

exports.lex = {
    options: {
        ranges: true
    },
    macros: {
        wb: '\\b',
        ows: '\\s*',
        ws: '\\s+',
        comment: '//.*?(?:\\n|\\r\\n?|\\u2028|\\u2029|$)|/\\*(?:.|\\s)*?(?:\\*/|$)',
        ident: '(?:[a-zA-Z_]|\\\\u[0-9a-fA-F]{4})(?:[a-zA-Z_$0-9]|\\\\u[0-9a-fA-F]{4})*',
        rx: '/(?:\\\\.|[^/])+/[gimsu]*'
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
        [['preventPrimitive'], '', function() {
            this.done = false;
            this.popState();
        }],

        // template
        [templateToken, function(yy, yytext) {
            const token = yytext.endsWith('`') ? 'TEMPLATE' : 'TPL_START';
            yytext = this.toStringLiteral(yytext, true, 1 + Number(token !== 'TEMPLATE'));
            if (token === 'TEMPLATE') {
                yy.pps();
            }
            return token;
        }],
        [['template'], templateToken, function(yy, yytext) {
            const token = yytext.endsWith('`') ? 'TPL_END' : 'TPL_CONTINUE';
            yytext = this.toStringLiteral(yytext, true, 1 + Number(token !== 'TPL_END'));
            this.popState();
            if (token === 'TPL_END') {
                yy.pps();
            }
            return token;
        }],
        [['template'], '', function() {
            this.parseError('Unexpected end of input');
        }],

        // braces
        ['\\(', 'return "(";'],
        ['\\)', 'yy.pps(); return ")";'],
        ['\\[', 'return "[";'],
        ['\\]', 'yy.pps(); return "]";'],
        ['\\{', 'return "{";'],
        ['\\}', function(yy) {
            if (this.bracketStack[this.bracketStack.length - 1] !== 'TPL_END') {
                yy.pps();
                return '}';
            }

            this.unput('}');
            this.begin('template');
        }],

        // keywords (should goes before ident)
        // eslint-disable-next-line no-unused-vars
        ['(true|false|null|undefined|Infinity|NaN){wb}', function(yytext) {
            yytext = this.toLiteral(yytext); // eslint-disable-line no-unused-vars
            return 'LITERAL';
        }],

        // keyword operators (should goes before IDENT)
        ['and{wb}', 'return "AND";'],
        ['or{wb}', 'return "OR";'],
        ['has{ws}no{wb}', 'return "HASNO";'],
        ['has{wb}', 'return "HAS";'],
        ['in{wb}', 'return "IN";'],
        ['not{ws}in{wb}', 'return "NOTIN";'],
        ['not?{wb}', 'return "NOT";'],
        ['(asc|desc)(NA?|AN?)?{wb}', 'return "ORDER";'],

        // primitives
        ['(\\d+\\.|\\.)?\\d+([eE][-+]?\\d+)?{wb}', 'yy.pps(); yytext = Number(yytext); return "NUMBER";'],
        ['0[xX][0-9a-fA-F]+', 'yy.pps(); yytext = parseInt(yytext, 16); return "NUMBER";'],
        ['"(?:\\\\[\\\\"]|[^"])*"', 'yy.pps(); yytext = this.toStringLiteral(yytext); return "STRING";'],
        ["'(?:\\\\[\\\\']|[^'])*'", 'yy.pps(); yytext = this.toStringLiteral(yytext); return "STRING";'],
        ['{rx}', 'yy.pps(); yytext = this.toRegExp(yytext); return "REGEXP";'],
        ['{ident}', 'yy.pps(); yytext = this.ident(yytext); return "IDENT";'],
        ['\\${ident}', 'yy.pps(); yytext = this.ident(yytext.slice(1)); return "$IDENT";'],

        // special vars
        ['@', 'yy.pps(); return "@";'],
        ['#', 'yy.pps(); return "#";'],
        ['\\$\\$', 'yy.pps(); return "$$";'],
        ['\\$', 'yy.pps(); return "$";'],

        // functions
        ['=>', 'return "FUNCTION";'],
        ['<(?!=)', function() {
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
        ['>', function() {
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
        ['\\?\\?', 'return "??";'],
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

        // bad token
        ['.', function(yylloc, yytext) {
            this.parseError(`Bad input on line ${yylloc.first_line} column ${yylloc.first_column}\n` + this.showPosition(), {
                text: yytext,
                token: 'BAD_TOKEN'
            });
        }],

        // eof
        ['$', 'return "EOF";']
    ]
};
exports.operators = [
    ['left', '|'],
    ['left', 'def'],
    ['left', ';'],
    ['left', 'FUNCTION'],
    ['left', 'compareFunction', 'compareExpr'],
    ['left', ','],
    ['right', '?', ':'],
    ['left', 'OR'],
    ['left', 'AND'],
    ['left', '??'],
    ['left', 'NOT'],
    ['left', 'IN', 'NOTIN', 'HAS', 'HASNO'],
    ['left', '=', '!=', '~='],
    ['left', '<', '<=', '>', '>='],
    ['left', '+', '-'],
    ['left', '*', '/', '%'],
    ['left', '.', '..', '...'],
    ['left', '.(', '.[', '..(']
];
exports.start = 'root';
exports.bnf = {
    root: [
        ['block EOF', 'return yy.buildResult($1)']
    ],

    block: [
        ['definitions e', $$(Block($1, $2))],
        ['definitions', $$(Block($1, $placeholder))],
        ['e', $$(Block([], $1))],
        ['', $$(Block([], $placeholder))]
    ],
    definitions: [
        ['def', $$([$1])],
        ['definitions def', '$1.push($2)']
    ],
    def: [
        ['$ ;', $$(Definition(Declarator_(null), null))],
        ['$ : e ;', $$(Definition(Declarator_(null), $3))],
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
        ['compareFunction', $$(CompareFunction($1))],

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
        ['e ?? e', $$(Binary($2, $1, $3))],
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
        ['( e )', $$(Parentheses($2))],
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
        ['{ }', $$(ObjectNode([]))],
        ['{ objectEntries }', $$(ObjectNode($2))],
        ['{ objectEntries , }', $$(ObjectNode($2))],
        ['{ definitions }', $$(ObjectNode([]))],
        ['{ definitions objectEntries }', $$(Block($2, ObjectNode($3)))],
        ['{ definitions objectEntries , }', $$(Block($2, ObjectNode($3)))]
    ],
    objectEntries: createCommaList('objectEntries', 'objectEntry'),
    objectEntry: [
        ['$', $$(ObjectEntry(Current(), null))],
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
        ['[ ]', $$(ArrayNode([]))],
        ['[ arrayElements ]', $$(ArrayNode($2))],
        ['[ arrayElements , ]', $$(ArrayNode($2))]
    ],

    compareFunction: createCommaList('compareFunction', 'compareExpr'),
    compareExpr: [
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
};
