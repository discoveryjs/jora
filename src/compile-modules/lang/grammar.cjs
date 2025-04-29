const {
    Arg1,
    Array: ArrayNode,
    Assertion,
    Binary,
    Block,
    Compare,
    CompareFunction,
    Conditional,
    Context,
    Current,
    Data,
    Declarator,
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
    Postfix,
    Prefix,
    Reference,
    SliceNotation,
    Spread,
    Template
} = require('./nodes.cjs');
const $0 = { code: '$0' };
const $1 = { code: '$1' };
const $1string = { code: 'String($1)' };
const $1name = { code: '$1.name' };
const $$1name = { code: '"$" + $1.name' };
const $2 = { code: '$2' };
const $3 = { code: '$3' };
const $4 = { code: '$4' };
const $5 = { code: '$5' };
const $6 = { code: '$6' };
const $r0 = { code: '@0.range' };
const $r1 = { code: '@1.range' };
const $ri1 = { code: '[@1.range[0]+1,@1.range[1]]' };
const $rm1 = { code: '[@1.range[0],@1.range[1]-1]' };
const $rr = { code: '[@1.range[1],@1.range[1]]' };
const $methodName = { code: 'this._mn' };
const $placeholder = { code: { ...Placeholder(), range: $rr } };
const refs = new Set([$0, $1, $1string, $1name, $$1name, $methodName, $2, $3, $4, $5, $6, $r0, $r1, $ri1, $rm1, $rr, $placeholder]);
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
        withRange(node);
    }

    return '$$ = ' + stringify(node);
}

function withRange(node, range = $r0) {
    node.range = range;

    return node;
}

function MethodIdentifier(name) {
    return withRange(Identifier(name), $rm1);
}

function MethodReference(name) {
    return withRange(Reference(name), $rm1);
}

function $$methodName(name) {
    return ';this._mn=' + stringify(name);
}

function createCommaList(name, element) {
    return [
        [element, $$([$1])],
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
        preventKeyword: 1,
        template: 2
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

        [['preventKeyword'], '{ident}\\(?', function(yy, yytext) {
            this.popState();
            if (yytext.endsWith('(')) {
                this.unput(yytext);
                return;
            }
            yy.pps();
            return 'IDENT';
        }],
        [['preventKeyword'], '', function() {
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
        ['is{wb}', 'return "IS";'],
        ['has{ws}no{wb}', 'return "HASNO";'],
        ['has{wb}', 'return "HAS";'],
        ['in{wb}', 'return "IN";'],
        ['not{ws}in{wb}', 'return "NOTIN";'],
        ['not{wb}', 'return "NOT";'],
        ['no{wb}', 'return "NO";'],
        ['(asc|desc)(NA?|AN?)?{wb}', 'return "ORDER";'],

        // methods & identifiers
        ['{ident}\\(', 'yytext = yytext.slice(0, -1); return "METHOD(";'],
        ['\\${ident}\\(', 'yytext = yytext.slice(1, -1); return "$METHOD(";'],
        ['{ident}', 'yy.pps(); return "IDENT";'],
        ['\\${ident}', 'yy.pps(); yytext = yytext.slice(1); return "$IDENT";'],

        // primitives
        ['(?:[_\\d]*\\.)?[_\\d]+(?:[eE][-+]?[_\\d]+)?{wb}', 'yy.pps(); yytext = this.toNumberLiteral(yytext, true); return "NUMBER";'],
        ['(?:\\d*\\.)?\\d+(?:[eE][-+]?\\d+)?{wb}', 'yy.pps(); yytext = this.toNumberLiteral(yytext); return "NUMBER";'],
        ['0[xX][_0-9a-fA-F]+', 'yy.pps(); yytext = this.toNumberLiteral(yytext, true, true); return "NUMBER";'],
        ['0[xX][0-9a-fA-F]+', 'yy.pps(); yytext = this.toNumberLiteral(yytext, false, true); return "NUMBER";'],
        ['"(?:\\\\[\\\\"]|[^"])*"', 'yy.pps(); yytext = this.toStringLiteral(yytext); return "STRING";'],
        ["'(?:\\\\[\\\\']|[^'])*'", 'yy.pps(); yytext = this.toStringLiteral(yytext); return "STRING";'],
        ['{rx}', 'yy.pps(); yytext = this.toRegExp(yytext); return "REGEXP";'],

        // special vars
        ['@', 'yy.pps(); return "@";'],
        ['#', 'yy.pps(); return "#";'],
        ['\\$\\$', 'yy.pps(); return "$$";'],
        ['\\$', 'yy.pps(); return "$";'],

        // functions
        ['=>', 'return "=>";'],

        // operators
        ['=', 'return "=";'],
        ['!=', 'return "!=";'],
        ['~=', 'return "~=";'],
        ['>=', 'return ">=";'],
        ['<=', 'return "<=";'],
        ['<', 'return "<";'],
        ['>', 'return ">";'],
        ['\\.\\.\\(', 'return "..(";'],
        ['\\.\\(', 'return ".(";'],
        ['\\.\\[', 'return ".[";'],
        ['\\.\\.\\.', 'return "...";'],
        ['\\.\\.', 'yy.pps(); yy.pks(); return "..";'],
        ['\\.', 'yy.pps(); yy.pks(); return ".";'],
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
    ['left', '=>'],
    ['left', 'compareFunction', 'compareExpr'],
    ['left', 'ORDER'],
    ['left', 'def'],
    ['left', ';'],
    ['left', ','],
    ['left', '|'],
    ['right', '?', ':'],
    ['left', 'IS'],
    ['left', 'OR'],
    ['left', 'AND'],
    ['left', '??'],
    ['left', 'NOT', 'NO'],
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
        ['$ ;', $$(Definition(withRange(Declarator(null), $r1), null))],
        ['$ : e ;', $$(Definition(withRange(Declarator(null), $r1), $3))],
        ['$ident ;', $$(Definition(withRange(Declarator($1name), $r1), null))],
        ['$ident : e ;', $$(Definition(withRange(Declarator($1name), $r1), $3))]
    ],
    ident: [
        ['IDENT', $$(Identifier($1))]
    ],
    $ident: [
        ['$IDENT', $$(Identifier($1))]
    ],

    condConsequent: [
        ['? e', $$($2)],
        ['?', $$($placeholder)]
    ],
    condAlternate: [
        [': e', $$($2)],
        [':', $$($placeholder)],
        ['', $$(null)]
    ],

    e: [
        ['query', asis],

        // functions
        ['=> e', $$(Function([], $2))],
        ['$IDENT => e', $$(Function([withRange(Identifier($1), $r1)], $3))],
        ['( ) => e', $$(Function([], $4))],
        ['( functionArgs ) => e', $$(Function($2, $5))],
        ['compareFunction', $$(CompareFunction($1))],

        // prefix operators
        ['NOT e', $$(Prefix($1, $2))],
        ['NO e', $$(Prefix($1, $2))],
        ['- e', $$(Prefix($1, $2))],
        ['+ e', $$(Prefix($1, $2))],

        // pipeline operator
        ['e | e', $$(Pipeline($1, $3))],
        ['e | definitions e', $$(Pipeline($1, Block($3, $4)))],

        // postfix operators
        ['e IS assertion', $$(Postfix($1, $3))],

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
        ['e condConsequent condAlternate', $$(Conditional($1, $2, $3))]
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
        ['IS assertion', $$(Prefix($1, $2))],
        ['condConsequent condAlternate', $$(Conditional(null, $1, $2))],
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
        ['..( block )', $$(MapRecursive(null, $2))],
        ['| e', $$(Pipeline(null, $2))],
        ['| definitions e', $$(Pipeline(null, Block($2, $3)))]
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
        ['METHOD( )', $$(Method(MethodIdentifier($1), [])) + $$methodName($1)],
        ['METHOD( arguments )', $$(Method(MethodIdentifier($1), $2)) + $$methodName($1)],
        ['$METHOD( )', $$(Method(MethodReference(MethodIdentifier($1)), [])) + $$methodName($1)],
        ['$METHOD( arguments )', $$(Method(MethodReference(MethodIdentifier($1)), $2)) + $$methodName($1)]
    ],
    arguments: createCommaList('arguments', 'e'),

    functionArg: [
        ['$IDENT', $$(Identifier($1))]
    ],
    functionArgs: createCommaList('functionArgs', 'functionArg'),

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
    objectEntryKeyLiteral: [
        ['STRING', $$(Literal($1))],
        ['NUMBER', $$(Literal($1))],
        ['LITERAL', $$(Literal($1))]
    ],
    objectEntry: [
        ['$', $$(ObjectEntry(Current(), null))],
        ['$ident', $$(ObjectEntry(Reference($1), null))],
        ['ident', $$(ObjectEntry($1, null))],
        ['method()', $$(ObjectEntry(Literal($methodName), $1))],
        ['objectEntryKeyLiteral', $$(ObjectEntry($1, null))],
        ['ident : e', $$(ObjectEntry($1, $3))],
        ['objectEntryKeyLiteral : e', $$(ObjectEntry($1, $3))],
        ['$ident : e', $$(ObjectEntry(withRange(Identifier($$1name), $r1), $3))],
        ['$ident e', $$(ObjectEntry($1, Pipeline(Reference($1), $2)))],
        ['ident e', $$(ObjectEntry($1, Pipeline(GetProperty(null, $1), $2)))],
        ['method() e', $$(ObjectEntry(Literal($methodName), Pipeline($1, $2)))],
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

    assertion: [
        ['assertionTerm', $$(Assertion($1))],
        ['NOT assertionTerm', $$(Assertion($2, true))],
        ['( assertionList )', $$(Assertion($2))],
        ['NOT ( assertionList )', $$(Assertion($3, true))]
    ],
    assertionTerm: [
        ['IDENT', $$(Identifier($1))],
        ['$', $$(Identifier($1))],
        ['$ident', $$(Method(Reference($1), []))],
        ['LITERAL', $$(Identifier($1string))]
    ],
    assertionList: [
        ['assertion', $$([$1])],
        ['assertionList AND assertion', '$1.push($2, $3)'],
        ['assertionList OR assertion', '$1.push($2, $3)']
    ],

    compareFunction: createCommaList('compareFunction', 'compareExpr'),
    compareExpr: [
        ['e ORDER', $$(Compare($1, $2))]
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
