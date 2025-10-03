# Jora Parser & Tokenizer Grammar (Reworked Parser)

This document describes the (current) grammar accepted by the new tokenizer & parser implementation (`src/lang/parser`). It intentionally preserves several legacy quirks for AST parity. Future clean‑ups (removing Block wrappers, normalizing ranges, defusing fused tokens) are noted as "Planned".

---
## 1. Tokens

Below are the logical token kinds produced by the tokenizer. Some are *fused* multi‑character structural tokens (e.g. `.(`, `..(`, `.[`) that encode adjacency; these may later be removed and handled contextually in the parser.

| Category | Token Type Constant | Lexeme / Description | Notes |
|----------|---------------------|----------------------|-------|
| Literal primitives | `TOKEN_NUMBER` | number literal | canonical numeric conversion applied |
|  | `TOKEN_STRING` | string literal | quotes preserved for conversion |
|  | `TOKEN_REGEXP` | regexp literal | `/.../flags` |
|  | `TOKEN_LITERAL` | keyword literal | `true`, `false`, `null`, `undefined`, etc. (lookup via `LITERALS`) |
| Identifiers | `TOKEN_IDENT` | identifier | bare identifier |
|  | `TOKEN_$IDENT` | `$ident` | used for user variables and parameters |
| Special refs | `TOKEN_AT` | `@` | data root |
|  | `TOKEN_HASH` | `#` | context root |
|  | `TOKEN_$` | `$` | current value |
|  | `TOKEN_$$` | `$$` | first argument / pipeline left value in some contexts |
| Keywords (logical) | `TOKEN_AND` | `and` | boolean and |
|  | `TOKEN_OR` | `or` | boolean or |
|  | `TOKEN_NOT` | `not` | logical negation (prefix) / assertion modifier |
|  | `TOKEN_NO` | `no` | negation variant in membership tests |
|  | `TOKEN_IS` | `is` | unary assertion or postfix assertion marker |
|  | `TOKEN_IN` | `in` | membership |
|  | `TOKEN_NOTIN` | `not in` | composite keyword (tokenized as one) |
|  | `TOKEN_HAS` | `has` | property membership |
|  | `TOKEN_HASNO` | `has no` | composite keyword |
|  | `TOKEN_ORDER` | `asc`, `desc`, and variants `ascN`, `descA`, etc. | ordering specifier inside compare function |
| Method open (fused) | `TOKEN_METHOD_OPEN` | `ident(` (with trailing `(`) | captures identifier + `(` adjacency |
|  | `TOKEN_$METHOD_OPEN` | `$ident(` | same but variable form |
| Templates | `TOKEN_TEMPLATE` | standalone template (no expressions) | single literal chunk |
|  | `TOKEN_TPL_START` | start chunk of template | `${` follows |
|  | `TOKEN_TPL_CONTINUE` | middle literal chunk | `${` follows |
|  | `TOKEN_TPL_END` | terminal literal chunk | ends template |
| Structural / operators | `TOKEN_DOT` | `.` | property / method chain prefix |
|  | `TOKEN_DOT_DOT` | `..` | recursive map short form prefix |
|  | `TOKEN_DOT_DOT_DOT` | `...` | spread operator (array/object) |
|  | `TOKEN_DOT_OPEN_PAREN` | `.(` | map operator (block form) |
|  | `TOKEN_DOT_OPEN_BRACKET` | `.[` | filter operator (block form) |
|  | `TOKEN_DOT_DOT_OPEN_PAREN` | `..(` | recursive map (block form) |
|  | `TOKEN_PIPE` | `|` | pipeline operator |
|  | `TOKEN_ARROW` | `=>` | function arrow |
| Comparison / equality | `TOKEN_EQUALS` | `=` | equality |
|  | `TOKEN_NOT_EQUALS` | `!=` | inequality |
|  | `TOKEN_MATCH` | `~=` | regexp (pattern) match |
| Relational | `TOKEN_LESS_THAN` | `<` |  |
|  | `TOKEN_LESS_THAN_EQUALS` | `<=` |  |
|  | `TOKEN_GREATER_THAN` | `>` |  |
|  | `TOKEN_GREATER_THAN_EQUALS` | `>=` |  |
| Arithmetic / numeric | `TOKEN_PLUS` | `+` | unary / binary |
|  | `TOKEN_MINUS` | `-` | unary / binary |
|  | `TOKEN_MULTIPLY` | `*` |  |
|  | `TOKEN_DIVIDE` | `/` |  |
|  | `TOKEN_MODULO` | `%` |  |
| Coalescing | `TOKEN_NULLISH_COALESCING` | `??` | nullish coalescing |
| Ternary | `TOKEN_QUESTION` | `?` | conditional (with `:` optional) |
| Delimiters | `TOKEN_OPEN_PAREN` / `TOKEN_CLOSE_PAREN` | `(` `)` | grouping / function params |
|  | `TOKEN_OPEN_BRACKET` / `TOKEN_CLOSE_BRACKET` | `[` `]` | arrays / slice / index |
|  | `TOKEN_OPEN_BRACE` / `TOKEN_CLOSE_BRACE` | `{` `}` | objects / block in map/filter |
|  | `TOKEN_COMMA` | `,` | list separator |
|  | `TOKEN_COLON` | `:` | key:value / slice separator / ternary |
|  | `TOKEN_SEMICOLON` | `;` | terminator for definitions |
| End | `TOKEN_EOF` | (end of input) | sentinel |

### Composite & Contextual Notes
- `TOKEN_NOTIN` and `TOKEN_HASNO` are multi-word tokens recognized by the tokenizer as a single unit.
- Fused tokens `.(`, `.[`, `..(`, plus `ident(` (`TOKEN_METHOD_OPEN`) and `$ident(` (`TOKEN_$METHOD_OPEN`) encode adjacency to avoid needing lookahead + backtracking in hot loops.
- Planned: emit raw whitespace/comment tokens to simplify range logic and remove reliance on previous token end positions.

---
## 2. Operator Precedence & Associativity
Higher numeric precedence binds tighter. Ternary `?` is right-associative; all others listed are left-associative. Operators not in the table are treated as precedence `-1` (non-operator in the expression loop).

| Precedence | Tokens (by type name / lexeme) | Associativity | Notes |
|------------|--------------------------------|---------------|-------|
| 12 | PLUS(+), MINUS(-), MULTIPLY(*), DIVIDE(/), MODULO(%) | left | Arithmetic & sign (unary handled separately) |
| 11 | LESS_THAN(<), LESS_THAN_EQUALS(<=), GREATER_THAN(>), GREATER_THAN_EQUALS(>=) | left | Relational |
| 10 | EQUALS(=), NOT_EQUALS(!=), MATCH(~=) | left | Equality / pattern |
| 9  | IN, NOTIN, HAS, HASNO | left | Membership & property tests |
| 8  | NOT, NO | left (prefix parsed earlier) | Unary in parseUnaryPrefix; precedence value prevents chaining issues |
| 7  | NULLISH_COALESCING(??) | left |  |
| 6  | AND | left |  |
| 5  | OR | left |  |
| 4  | IS | left (prefix/postfix special) | Treated as unary or postfix assertion trigger |
| 3  | QUESTION(?) | right | Ternary conditional (?:); colon optional -> null alternate |
| 2  | PIPE(|) | left | Pipeline (binds tighter than ORDER) |
| 1  | ORDER (asc*/desc* variants) | left | Only valid inside compare function sequence |

Right-associativity implemented by *not* bumping precedence when parsing RHS (see `RIGHT_ASSOCIATIVE` set in parser).

---
## 3. Grammar (Informal EBNF)
This grammar mixes core syntactic forms and legacy wrappers. Non-terminals in UPPER_CASE only when they are lexical tokens; others are parser productions. Optional legacy behaviors are annotated.

```
Program            ::= Block

Block              ::= Definition* Expression?            // Always produces Block node (body may be Placeholder)
Definition         ::= Declarator (':' Expression)? ';'
Declarator         ::= '$' | '$' IDENT                    // '$' alone defines an anonymous placeholder var
                     | '$' IDENT (tokenized as $IDENT)

Expression         ::= TernaryExpression

TernaryExpression  ::= PipelineExpression ('?' Expression (':' Expression)? )*
                       // Parsed via precedence climbing; '?' is right-associative.

PipelineExpression ::= CompareOrderExpression ( '|' (Definition* Expression)? )*
                       // Right side may start with local definitions -> wrapped in Block node (legacy)

CompareOrderExpression ::= OrExpression ( ORDER OrExpression )*  // Each ORDER extends previous into CompareFunction

OrExpression       ::= AndExpression ( 'or' AndExpression )*
AndExpression      ::= NullishExpression ( 'and' NullishExpression )*
NullishExpression  ::= EqualityExpression ( '??' EqualityExpression )*
EqualityExpression ::= RelationalExpression ( ( '=' | '!=' | '~=' ) RelationalExpression )*
RelationalExpression ::= MembershipExpression ( ('<' | '<=' | '>' | '>=') MembershipExpression )*
MembershipExpression ::= UnaryExpression ( ( 'in' | 'not in' | 'has' | 'has no' ) UnaryExpression )*
UnaryExpression    ::= ( 'not' | 'no' | '+' | '-' | 'is' ) UnaryExpression
                     | PostfixChain

PostfixChain       ::= Primary ( PostfixOp )*
PostfixOp          ::= AssertionPostfix
                     | '.' IDENT
                     | '.' MethodCall
                     | '.(' Block ')'
                     | '.[' Block ']'
                     | '..' ( IDENT | MethodCall )
                     | '..(' Block ')'
                     | '[' SliceOrPick

AssertionPostfix   ::= 'is' Assertion
Assertion          ::= 'not'? AssertionTerm ( ( 'and' | 'or' ) AssertionTerm )*
AssertionTerm      ::= IDENT
                     | LITERAL
                     | '(' Assertion ')'
                     | '$' IDENT   // tokenized as $IDENT -> legacy Method(empty) node (FIXME -> Reference)

Primary            ::= Literal
                     | Template
                     | SpecialReference
                     | '$' IDENT FunctionOrReference // $IDENT may start function or variable
                     | IDENT PropertyAccessOrMethod  // IDENT can start property access (implicit value) or map recursive short forms
                     | MethodCall
                     | Array
                     | Object
                     | Parenthesized
                     | FunctionExpression
                     | PlaceholderFunction            // '=>' leading arrow

SpecialReference   ::= '@' | '#' | '$' | '$$'

Literal            ::= NUMBER | STRING | REGEXP | LITERAL | TemplateStringParts
Template           ::= TEMPLATE
                     | TPL_START ( Expression TPL_CONTINUE )* Expression? TPL_END

FunctionExpression ::= ( '(' ParamList? ')' | '$' IDENT ) '=>' ExpressionOrPlaceholder
ParamList          ::= Identifier ( ',' Identifier )*
Identifier         ::= IDENT | $IDENT (leading '$' stripped)
ExpressionOrPlaceholder ::= Expression | /* empty -> Placeholder node */

MethodCall         ::= ( METHOD_OPEN | $METHOD_OPEN ) ArgList? ')'
ArgList            ::= Expression ( ',' Expression )*

Array              ::= '[' ( (Spread | Expression) ( ',' (Spread | Expression) )* )? ']'
Spread             ::= '...' Expression
SliceOrPick        ::= Expression ':' Expression ( ':' Expression )? ']'    // SliceNotation
                     | Expression ']'                                      // Pick (bracket access)

Object             ::= '{' Definition* ( ( Spread | ObjectEntry ) (',' ( Spread | ObjectEntry ) )* )? '}'
                       // Legacy: if definitions exist, final AST is Block(defs, Object)
ObjectEntry        ::= ObjectKey ( ':' Expression )?   // Shorthand when ':' absent
ObjectKey          ::= IDENT
                     | STRING | NUMBER | LITERAL
                     | SpecialReference
                     | $IDENT ( shorthand -> Reference / explicit -> Identifier )
                     | '[' Expression ']'

Parenthesized      ::= '(' Definition* Expression? ')'  // Legacy: definitions wrap body in Block

Map                ::= '.(' Block ')'
Filter             ::= '.[' Block ']'
MapRecursive       ::= '..(' Block ')'
                     | '..' IDENT
                     | '..' MethodCall
Pick               ::= '[' Expression ']'                // from postfix chain (after Primary)

CompareFunction    ::= <Produced when ORDER tokens appear sequentially>
                        Compare (',' Compare)*
Compare            ::= Expression ORDER

Conditional        ::= Expression '?' Expression (':' Expression)?
Binary             ::= Expression <op> Expression        // for operators with precedence >= 4 except ternary & pipeline & order

PlaceholderFunction ::= '=>' ExpressionOrPlaceholder

Placeholder        ::= (Inserted where an expression is syntactically optional but omitted)
```

### Legacy / Parity Quirks
- Block wrappers appear in: top-level program, pipelines with leading definitions on the RHS, objects / parentheses / map/filter bodies that start with definitions.
- Postfix node ranges start at the left operand's start (inflated ranges). Planned to localize.
- `$IDENT` inside an assertion becomes a `Method` node with empty `arguments` (to be converted to plain `Reference`).
- Fused tokens encode adjacency (e.g., `.(` instead of `.` + `(`) for performance; planned to remove by parser lookahead.

---
## 4. AST Node Overview (Current)
Minimal summary (fields beyond `type` + `range`):
- Block: { definitions: Definition[], body: Expression }
- Definition: { declarator, value|null }
- Declarator: { name|null }               // null when plain '$'
- Identifier: { name }
- Reference: { name (Identifier node) }
- Data | Context | Current | Arg1: (no extra fields)
- Literal: { value }
- Template: { values: (Literal|Expression)[] }
- Function: { arguments: Identifier[], body: Expression|Placeholder }
- Method: { reference: Identifier|Reference, arguments: Expression[] }
- MethodCall: { value: Expression|null, method: Method }
- GetProperty: { value: Expression|null, property: Identifier }
- Map / Filter / MapRecursive: { value: Expression, query: Block|GetProperty|MethodCall }
- Pick: { value: Expression, getter: Expression }
- SliceNotation: { value: Expression|null, arguments: [start, end, (step?)] }
- Array: { elements: (Expression|Spread)[] }
- Spread: { query: Expression, array: boolean }
- Object: { properties: ObjectEntry[] }
- ObjectEntry: { key: (Identifier|Literal|Reference|Expression), value: Expression|null }
- Pipeline: { left, right }
- Conditional: { test, consequent, alternate|null }
- Binary: { left, right, operator }
- Prefix / Postfix: { operator, argument }
- Assertion: { negation: boolean, assertion: (Identifier|Literal|Method|Assertion|Array) } // structure preserved from legacy
- CompareFunction: { compares: Compare[] }
- Compare: { query: Expression, order: string }
- Placeholder: {} (range start==end)

---
## 5. Planned Improvements
- Emit whitespace & comment tokens -> simplify range computation.
- Replace fused tokens with adjacency checks (parser only sees simple tokens '.', '(', '[' etc.).
- Normalize postfix node ranges to local spans.
- Remove Block wrapper insertion for inner definition lists (represent definitions as explicit list preceding expression instead).
- Treat `$IDENT` in assertions as Reference, remove empty Method hack.
- Possibly unify keywords as identifiers + contextual interpretation during parse for simpler tokenizer.

---
## 6. Precedence Implementation Detail
The precedence climbing loop increments the precedence for left‑associative operators when parsing the RHS (`prec + 1`), but leaves it unchanged for right‑associative ones. Operators not present in the `PRECEDENCE` table evaluate as `-1`, which short‑circuits the loop efficiently.

---
## 7. Error Handling
Current implementation throws generic `Error` messages without position metadata. Planned: enrich with token span (line/column) and structured codes; add recovery strategies for better diagnostics (especially around assertions and incomplete ternaries / pipelines).

---
Generated on: 2025-09-25
