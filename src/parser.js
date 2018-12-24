const { Parser } = require('jison');

function code(s) {
    return '$$ = [' +
        s[0].split(/(\$[\da-zA-Z_]+|\/\*\S*@[\da-zA-Z_$]+(?:\/\S*@[\da-zA-Z_$]+)*\*\/\$?[\da-zA-Z_]+)/g).map(
            (m, i) => {
                if (i % 2) {
                    if (m[0] === '/') {
                        const content = m.substring(2, m.indexOf('*/'));
                        const expr = m.substr(content.length + 4);
                        const ranges = content.split('/').map(range => {
                            const [context, loc] = range.split('@');
                            return '"+@' + loc + '.range+",' + context;
                        });

                        return (
                            '"/*s*/",' +
                            (expr[0] === '$' ? expr : '"' + expr + '"') +
                            ',"/*' + ranges + '*/"'
                        );
                    } else {
                        return m;
                    }
                } else {
                    return JSON.stringify(m);
                }
            }
        ).filter(term => term !== '""') +
    '];';
}

const switchToPreventRxState = 'if (this._input) this.begin("preventRx"); ';
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
            comment: '//.*?(\\r|\\n|$)+',
            rx: '/(?:\\\\.|[^/])+/i?'
        },
        startConditions: {
            preventRx: 0
        },
        rules: [
            // ignore comments and whitespaces
            ['{comment}', '/* a comment */'],
            ['{ws}', '/* a whitespace */'],

            // hack to prevent regexp consumption
            [['preventRx'], '\\/', 'this.popState(); return "/";'],
            // FIXME: using `this.done = false;` is hack, since `regexp-lexer` set done=true
            // when no input left and doesn't take into account current state;
            // should be fixed in `regexp-lexer`
            [['preventRx'], '', 'this.done = false; this.popState();'],

            // braces
            ['\\(', 'return "(";'],
            ['\\)', switchToPreventRxState + 'return ")";'],
            ['\\[', 'return "[";'],
            ['\\]', switchToPreventRxState + 'return "]";'],
            ['\\{', 'return "{";'],
            ['\\}', 'return "}";'],

            // operators
            ['=', 'return "=";'],
            ['!=', 'return "!=";'],
            ['~=', 'return "~=";'],
            ['>=', 'return ">=";'],
            ['<=', 'return "<=";'],
            ['<', 'return "<";'],
            ['>', 'return ">";'],
            ['and{wb}', 'return "AND";'],
            ['or{wb}' , 'return "OR";'],
            ['in{wb}', 'return "IN";'],
            ['not{ws}in{wb}', 'return "NOTIN";'],
            ['not?{wb}', 'return "NOT";'],

            // keywords
            ['true{wb}', 'return "TRUE";'],
            ['false{wb}', 'return "FALSE";'],
            ['null{wb}', 'return "NULL";'],
            ['undefined{wb}', 'return "UNDEFINED";'],

            // self
            ['::self', 'return "SELF";'],

            // primitives
            ['\\d+(?:\\.\\d+)?{wb}', switchToPreventRxState + 'return "NUMBER";'],    // 212.321
            ['"(?:\\\\.|[^"])*"', switchToPreventRxState + 'return "STRING";'],       // "foo" "with \" escaped"
            ["'(?:\\\\.|[^'])*'", switchToPreventRxState + 'return "STRING";'],       // 'foo' 'with \' escaped'
            ['{rx}', 'return "REGEXP"'],                                              // /foo/i
            ['[a-zA-Z_][a-zA-Z_$0-9]*', switchToPreventRxState + 'return "SYMBOL";'], // foo123

            // operators
            ['\\.\\.\\(', 'return "..(";'],
            ['\\.\\(', 'return ".(";'],
            ['\\.\\[', 'return ".[";'],
            ['\\.\\.\\.', 'return "...";'],
            ['\\.\\.', 'return "..";'],
            ['\\.', 'return ".";'],
            ['\\?', 'return "?";'],
            [',', 'return ",";'],
            [':', 'return ":";'],
            [';', 'return ";";'],
            ['\\-', 'return "-";'],
            ['\\+', 'return "+";'],
            ['\\*', 'return "*";'],
            ['\\/', 'return "/";'],
            ['\\%', 'return "%";'],

            // special vars
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
            ['', code`return /*@$*/current`]
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
            ['e IN e', code`fn.in($1, /*in-value@1*/$3)`],
            ['e NOTIN e', code`!fn.in($1, $3)`],
            ['e AND e', code`fn.bool($1) ? $3 : $1`],
            ['e OR e', code`fn.bool($1) ? $1 : $3`],
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
            ['SYMBOL', code`fn.get(/*@1*/current, "$1")`],
            ['. SYMBOL', code`fn.get(/*@2*/current, "$2")`],
            ['( e )', code`($2)`],
            ['.( block )', code`fn.get(current, current => { $2 })`],
            ['SYMBOL ( )', code`method.$1(/*@1/@2*/current)`],
            ['SYMBOL ( arguments )', code`method.$1(/*@1*/current, $3)`],
            ['. SYMBOL ( )', code`method.$2(/*@2/@3*/current)`],
            ['. SYMBOL ( arguments )', code`method.$2(/*@2*/current, $4)`],
            ['.. SYMBOL', code`fn.recursive(/*@2*/current, "$2")`],
            ['..( block )', code`fn.recursive(current, current => { $2 })`],
            ['.[ block ]', code`fn.filter(current, current => { $2 })`]
        ],

        relativePath: [
            ['query . SYMBOL', code`fn.get(/*@3*/$1, "$3")`],
            ['query . SYMBOL ( )', code`method.$3(/*@3/@4*/$1)`],
            ['query . SYMBOL ( arguments )', code`method.$3(/*@3*/$1, $5)`],
            ['query .( block )', code`fn.get($1, current => { $3 })`],
            ['query .. SYMBOL', code`fn.recursive(/*@3*/$1, "$3")`],
            ['query ..( block )', code`fn.recursive($1, current => { $3 })`],
            ['query .[ block ]', code`fn.filter($1, current => { $3 })`],
            ['query [ e ]', code`fn.get($1, $3)`]
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
            ['SYMBOL', code`$1: fn.get(/*@1*/current, "$1")`],
            ['$ SYMBOL', code`$2: $$2`],
            ['SYMBOL : e', code`$1: $3`],
            ['[ e ] : e', code`[$2]: $5`],
            ['...', code`...current`],
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
            ['< e >', code`current => $2`]
        ]
    }
};

const tollerantScopeStart = new Set([
    '\\.', '\\.\\.', ',',
    '\\+', '\\-', '\\*', '\\/', '\\%',
    '=', '!=', '~=', '>=', '<=', /* '<',*/ '>',
    'and{wb}', 'or{wb}', 'in{wb}', 'not{ws}in{wb}', 'not?{wb}'
]);
const tollerantGrammar = Object.assign({}, grammar, {
    lex: Object.assign({}, grammar.lex, {
        startConditions: Object.assign({}, grammar.lex.startConditions, {
            suggestPoint: 1,
            suggestPointWhenWhitespace: 1
        }),
        rules: [
            [['suggestPoint'],
                // prevent suggestions before rx
                '(?=({ows}{comment})*{ows}{rx})',
                'this.popState();'
            ],
            [['suggestPoint'],
                '(?=({ows}{comment})*{ows}([\\]\\)\\}\\<\\>\\+\\-\\*\\/,~!=]|$))',
                // FIXME: using `this.done = false;` is hack, since `regexp-lexer` set done=true
                // when no input left and doesn't take into account current state;
                // should be fixed in `regexp-lexer`
                'this.popState(); this.done = false; yytext = "_"; ' + switchToPreventRxState + 'return "SYMBOL";'
            ],
            [['suggestPointWhenWhitespace'],
                '{ws}',
                'this.popState(); this.begin("suggestPoint");'
            ],
            [['suggestPoint', 'suggestPointWhenWhitespace'],
                '',
                'this.popState();'
            ]
        ].concat(
            grammar.lex.rules.map(entry => {
                let [sc, rule, action] = entry.length === 3 ? entry : [undefined, ...entry];

                if (tollerantScopeStart.has(rule)) {
                    action = `this.begin("suggestPoint${
                        rule.endsWith('{wb}') ? 'WhenWhitespace' : ''
                    }"); ${action}`;
                }

                return entry.length === 3 ? [sc, rule, action] : [rule, action];
            })
        )
    })
});

// guard to keep in sync tollerantScopeStart and lex rules
tollerantScopeStart.forEach(rule => {
    if (tollerantGrammar.lex.rules.every(lexRule => lexRule[0] !== rule)) {
        throw new Error('Rule missed in lexer: ' + rule);
    }
});

const strictParser = new Parser(grammar);
const tollerantParser = new Parser(tollerantGrammar);

module.exports = strictParser;
module.exports.strict = strictParser;
module.exports.tollerant = tollerantParser;
