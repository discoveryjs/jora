const { isPlainObject } = require('../utils');
const isArray = [].constructor.isArray;
const keys = {}.constructor.keys;
const $0 = { name: '$0' };
const $1 = { name: '$1' };
const $2 = { name: '$2' };
const $3 = { name: '$3' };
const $4 = { name: '$4' };
const $5 = { name: '$5' };
const $r0 = { name: '@0.range' };
const refs = new Set([$0, $1, $2, $3, $4, $5, $r0]);
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

function $$(node, ...suggestions) {
    if (isPlainObject(node)) {
        node.range = $r0;
    }

    suggestions = suggestions.length
        ? '; yy.suggestRanges.push(' + suggestions.filter(Boolean) + ')'
        : '';

    return '$$ = ' + stringify(node) + suggestions;
}

function Suggestion(start, end, types, context) {
    return `[${[
        start ? start.name.replace(/\$/, '@') : 'null',
        end ? end.name.replace(/\$/, '@') : 'null',
        stringify(types),
        stringify(context) || null
    ].concat(context === 'current' ? '$$' : [])}]`;
}

function SuggestQueryRoot() {
    return Suggestion(null, $0, ['var', 'path'], 'current');
}

function SuggestIdent(ref, from) {
    return Suggestion(ref, ref, 'path', from);
}

function SuggestMethod() {
    // Suggestion(ref, ref, 'method', null);
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

function Compare(query, order) {
    return {
        type: 'Compare',
        query,
        order
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

function SliceNotation(value, arguments) {
    return {
        type: 'SliceNotation',
        value,
        arguments
    };
}

function Pipeline(left, right) {
    return {
        type: 'Pipeline',
        left,
        right
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
            comment: '//.*?(\\r|\\n|$)',
            ident: '[a-zA-Z_][a-zA-Z_$0-9]*',
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
            ['(true|false|null|undefined){wb}', 'yytext = this.toLiteral(yytext);return "LITERAL";'],

            // keyword operators (should goes before IDENT)
            ['and{wb}', 'return "AND";'],
            ['or{wb}' , 'return "OR";'],
            ['has{ws}no{wb}', 'return "HASNO";'],
            ['has{wb}', 'return "HAS";'],
            ['in{wb}', 'return "IN";'],
            ['not{ws}in{wb}', 'return "NOTIN";'],
            ['not?{wb}', 'return "NOT";'],
            ['(asc|desc){wb}', 'return "ORDER";'],

            // primitives
            ['(\\d+\\.|\\.)?\\d+([eE][-+]?\\d+)?{wb}', switchToPreventPrimitiveState + 'yytext = Number(yytext); return "NUMBER";'],  // 212.321
            ['"(?:\\\\.|[^"])*"', switchToPreventPrimitiveState + 'yytext = this.toStringLiteral(yytext); return "STRING";'],       // "foo" "with \" escaped"
            ["'(?:\\\\.|[^'])*'", switchToPreventPrimitiveState + 'yytext = this.toStringLiteral(yytext); return "STRING";'],       // 'foo' 'with \' escaped'
            ['{rx}', switchToPreventPrimitiveState + 'yytext = this.toRegExp(yytext); return "REGEXP";'], // /foo/i
            ['{ident}', switchToPreventPrimitiveState + 'return "IDENT";'], // foo123
            ['\\${ident}', switchToPreventPrimitiveState + 'yytext = yytext.slice(1); return "$IDENT";'], // $foo123

            // special vars
            ['@', switchToPreventPrimitiveState + 'return "@";'],
            ['#', switchToPreventPrimitiveState + 'return "#";'],
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
            ['definitions', $$(Block($1, Current()))],
            ['e', $$(Block([], $1))],
            ['', $$(Block([], Current()), Suggestion($0, null, ['var', 'path'], 'current'))]
        ],
        definitions: [
            ['def', $$([$1])],
            ['definitions def', '$1.push($2)']
        ],
        def: [
            ['$ ;', $$(Definition(null, Current()), Suggestion($1, $1, 'path', 'current'))], // do nothing, but collect stat (suggestions)
            ['$ident ;', $$(Definition($1, GetProperty(Current(), $1)), SuggestIdent($1, 'current'))],
            ['$ident : e ;', $$(Definition($1, $3))]
        ],

        ident: [
            ['IDENT', $$(Identifier($1))]
        ],
        $ident: [
            ['$IDENT', $$(Identifier($1))]
        ],

        e: [
            ['query', asis],

            // functions
            ['FUNCTION_START block FUNCTION_END', $$(Function([], $2))],
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
            ['e IN e', $$(Binary($2, $1, $3), Suggestion($1, $1, 'in-value', $3))],
            ['e HAS e', $$(Binary($2, $1, $3), Suggestion($3, $3, 'in-value', $1))],
            ['e NOTIN e', $$(Binary($2, $1, $3))],
            ['e HASNO e', $$(Binary($2, $1, $3))],
            ['e AND e', $$(Binary($2, $1, $3))],
            ['e OR e', $$(Binary($2, $1, $3))],
            ['e + e', $$(Binary($2, $1, $3))],
            ['e - e', $$(Binary($2, $1, $3))],
            ['e * e', $$(Binary($2, $1, $3))],
            ['e / e', $$(Binary($2, $1, $3))],
            ['e % e', $$(Binary($2, $1, $3))],
            ['e = e', $$(Binary($2, $1, $3), Suggestion($3, $3, 'value', $1))],
            ['e != e', $$(Binary($2, $1, $3), Suggestion($3, $3, 'value', $1))],
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
            ['$', $$(Current(), Suggestion($1, $1, 'var', 'current')), { prec: 'def' }],
            ['$ident', $$(Reference($1), Suggestion($1, $1, 'var', 'current')), { prec: 'def' }],
            ['STRING', $$(Literal($1))],
            ['NUMBER', $$(Literal($1))],
            ['REGEXP', $$(Literal($1))],
            ['LITERAL', $$(Literal($1))],
            ['object', asis],
            ['array', asis],
            ['[ sliceNotation ]', $$(SliceNotation(Current(), $2))],
            ['ident', $$(GetProperty(Current(), $1), Suggestion($1, $1, 'var', 'current'), SuggestIdent($1, 'current'))],
            ['ident ( )', $$(MethodCall(Current(), $1, []), SuggestMethod($1), Suggestion($3, $2, ['var', 'path'], 'current'))],
            ['ident ( arguments )', $$(MethodCall(Current(), $1, $3), SuggestMethod($1))],
            ['( e )', $$(Parentheses($2))], // NOTE: using e instead of block for preventing a callback creation
            ['( definitions e )', $$(Parentheses(Block($2, $3)))],
            ['. ident', $$(GetProperty(Current(), $2), SuggestQueryRoot(), SuggestIdent($2, 'current'))],
            ['. ident ( )', $$(MethodCall(Current(), $2, []), SuggestQueryRoot(), SuggestIdent($2, 'current'), SuggestMethod($2), Suggestion($4, $3, ['var', 'path'], 'current'))],
            ['. ident ( arguments )', $$(MethodCall(Current(), $2, $4), SuggestQueryRoot(), SuggestIdent($2, 'current'), SuggestMethod($2))],
            ['.( block )', $$(Map(Current(), $2), SuggestQueryRoot())],
            ['.[ block ]', $$(Filter(Current(), $2), SuggestQueryRoot())],
            ['.. ident', $$(Recursive(Current(), GetProperty(Current(), $2)), SuggestQueryRoot(), SuggestIdent($2, 'current'))],
            ['.. ident ( )', $$(Recursive(Current(), MethodCall(Current(), $2, [])), SuggestQueryRoot(), SuggestIdent($2, 'current'), Suggestion($4, $3, ['var', 'path'], 'current'))],
            ['.. ident ( arguments )', $$(Recursive(Current(), MethodCall(Current(), $2, $4)), SuggestQueryRoot(), SuggestIdent($2, 'current'))],
            ['..( block )', $$(Recursive(Current(), $2), SuggestQueryRoot())]
        ],
        relativePath: [
            ['query [ e ]', $$(GetProperty($1, $3))],
            ['query [ sliceNotation ]', $$(SliceNotation($1, $3))],
            ['query . ident', $$(GetProperty($1, $3), SuggestIdent($3, $1))],
            ['query . ident ( )', $$(MethodCall($1, $3, []), SuggestIdent($3, $1), SuggestMethod($3), Suggestion($5, $4, ['var', 'path'], 'current'))],
            ['query . ident ( arguments )', $$(MethodCall($1, $3, $5), SuggestIdent($3, $1), SuggestMethod($3))],
            ['query .( block )', $$(Map($1, $3))],
            ['query .[ block ]', $$(Filter($1, $3))],
            ['query .. ident', $$(Recursive($1, GetProperty(Current(), $3)), SuggestIdent($3, $1))],
            ['query .. ident ( )', $$(Recursive($1, MethodCall(Current(), $3, [])), SuggestIdent($3, $1), SuggestMethod($3), Suggestion($5, $4, ['var', 'path'], 'current'))],
            ['query .. ident ( arguments )', $$(Recursive($1, MethodCall(Current(), $3, $5)), SuggestIdent($3, $1), SuggestMethod($3))],
            ['query ..( block )', $$(Recursive($1, $3))]
        ],

        arguments: createCommaList('arguments', 'e'),

        object: [
            ['{ }', $$(Object([]), Suggestion($2, $1, ['var', 'path'], 'current'))],
            ['{ properties }', $$(Object($2))]
        ],
        properties: createCommaList('properties', 'property'),
        property: [
            ['ident', $$(Property($1, GetProperty(Current(), $1)), Suggestion($1, $1, 'var', 'current'), SuggestIdent($1, 'current'))],
            ['$', $$(Property(null, Current()), Suggestion($1, $1, 'var', 'current'))],  // do nothing, but collect stat (suggestions)
            ['$ident', $$(Property($1, Reference($1)), Suggestion($1, $1, 'var', 'current'))],
            ['ident : e', $$(Property($1, $3))],
            ['STRING : e', $$(Property(Literal($1), $3))],
            ['NUMBER : e', $$(Property(Literal($1), $3))],
            ['LITERAL : e', $$(Property(Literal($1), $3))],
            ['[ e ] : e', $$(Property($2, $5))],
            ['...', $$(Spread(Current()), Suggestion($1, null, ['var', 'path'], 'current'))],
            ['... query', $$(Spread($2))]
        ],

        arrayElements: createCommaList('arrayElements', 'arrayElement'),
        arrayElement: [
            ['e', asis],
            ['...', $$(Spread(Current()), Suggestion($1, null, ['var', 'path'], 'current'))],
            ['... e', $$(Spread($2))]
        ],
        array: [
            ['[ ]', $$(Array([]), Suggestion($2, $1, ['var', 'path'], 'current'))],
            ['[ arrayElements ]', $$(Array($2))]
        ],

        sortingCompareList: createCommaList('sortingCompareList', 'sortingCompare'),
        sortingCompare: [
            ['query ORDER', $$(Compare($1, $2))]
        ],

        sliceNotation: [
            ['sliceNotationComponent', $$([null, $1])],
            ['sliceNotationComponent sliceNotationComponent', $$([null, $1, $2])],
            ['e sliceNotationComponent', $$([$1, $2])],
            ['e sliceNotationComponent sliceNotationComponent', $$([$1,$2,$3])]
        ],
        sliceNotationComponent: [
            [':', $$(null)],
            [': e', $$($2)]
        ]
    }
};
