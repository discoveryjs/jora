## next

- Extended query result object in stat mode to provide a result value of the query execution as `value` property (i.e. `jora(query, { stat: true })().value`)
- Renamed `SortingFunction` AST node type into `CompareFunction`
- Added nullish coalescing operator (`??`)
- Added `replace()` method
- Added `min()` and `max()` methods
- Added `sum()` method
- Added `indexOf()` and `lastIndexOf()` methods
- Added `toLowerCase()`, `toUpperCase()` and `trim()` methods
- Added math methods `abs()`, `acos()`, `acosh()`, `asin()`, `asinh()`, `atan()`, `atan2()`, `atanh()`, `cbrt()`, `ceil()`, `clz32()`, `cos()`, `cosh()`, `exp()`, `expm1()`, `floor()`, `fround()`, `hypot()`, `imul()`, `log()`, `log10()`, `log1p()`, `log2()`, `pow()`, `round()`, `sign()`, `sin()`, `sinh()`, `sqrt()`, `tan()`, `tanh()` and `trunc()`. All the methods works the same as static methods of [`Math`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math) in JavaScript
- Changed the comparator function grammar to allow any expression in the definition, not just a query chain. This eliminates the need for parentheses in many cases. For example, `a + b desc` is now a valid definition, whereas previously it required parentheses: `(a + b) desc` (since evaluated as `a + (b desc)`).
- Changed precedence of function definitions to be lower than that of the pipeline operator and comparator function definitions (i.e., the lowest precedence). For example, the expression `=> a | b` now evaluates as `=> (a | b)` instead of `(=> a) | b` as before, meaning it returns a function instead of the value of `b`.
- Changed `split()` method to support arrays, in that case `pattern` can be a function or any value
- Fixed `in`, `not in`, `has` and `has no` operators to handle `NaN` values correctly, e.g. `NaN in [1, NaN, 3]` returns `true` now

## 1.0.0-beta.7 (July 12, 2022)

- Fixed `syntax.tokenize()` method to use a tolerant parser when `tolerantMode` parameter is `true`
- Fixed parsing failures in tolerant mode on blocks `[]`, `.[]`, `()`, `.()` and `..()` when their body starts with an operator, a keyword, etc.
- Fixed suggestions when pattern is a single quoted string (i.e. for `'foo'` in `.[field='foo']`)
- Fixed suggestions for `Pick` nodes when query is a complex expression, e.g. a function (#35)
- Fixed suggestions for `Block` nodes with empty body in strict parse mode
- Fixed processing `\0` in strings as a null character for a [parity](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String#escape_sequences) with JavaScript
- Fixed `Indentifier` node to store an empty string as a name instead of `_` for placeholder identifiers in tolerant parse mode. This fixes the problem of restoring a query from an AST after parsing in tolerant mode
- Added `Placeholder` node type
- Changed `Block` node to store a `Placeholder` node instead of `null` when block's body is empty

## 1.0.0-beta.6 (April 18, 2022)

- Added support for custom methods as a string (jora query) in `jora.setup()`
- Added a check for all methods are defined on query compilation step to avoid runtime exceptions
- Allowed `g`, `m`, `s` and `u` flags in regexp literals
- Improved error message when a methods is not defined, i.e. `Method "foo" is not defined` instead of `m.foo is not a function`
- Improved error locations in string literals
- Disallowed a backslash before closing quote or apostrophe in string literals
- Fixed `match()` method to work well for RegExp with `g` flag and for strings when `matchAll` is true
- Fixed `sort()` method to perform a stable sort for old js-engines and always place `undefined` values last
- Fixed range in details for bad input errors
- Fixed suggestion support in template literals (#33)
- Fixed suggestions for `=` and `!=` operators by avoiding unfold array values
- Fixed suggestions for arrays in `in`, `not in`, `has` and `has no` operators to exclude literal values only
- Removed value suggestions in cases `| in <string or number>` and `<string or number> has |`
- Fixed a call stack overflow exception when too many (over ~110k) suggestion values for a range
- **BREAKING** Reworked stat API:
    - Changed `stat()` API method to return `values` as is, i.e. a `Set` instance instead of its materialization as an array. Mutations of sets (`values` and `related`) should be avoided since they are shared between all stat API methods calls.
    - Changed a signature of `suggestion()` API method to get `options` as a second argument (optional), with the following options:
        - `limit` (default: `Infinity`) – a max number of the values that should be returned for each value type (`"property"`, `"value"` or `"variable"`)
        - `sort` (default: `false`) – a comparator function (should take 2 arguments and return a negative number, `0` or a positive number) for value list sorting, makes sence when `limit` is used
        - `filter` (default: `function`) – a filter function factory (`pattern => value => <expr>`) to discard values from the result when returns a falsy value (default is equivalent to `patttern => value => String(value).toLowerCase().includes(pattern)`)
    - Changed `suggestion()` API method result to return values grouped by a type:
        ```ts
            suggestion(): Array<{
                type: 'property' | 'value' | 'variable',
                from: number,
                to: number,
                text: string,
                suggestions: Array<string | number>
            }> | null
        ```
    - All the changes are targeted to improve performance and memory consumption when a query is performing to a huge datasets (hundreds of thousands of values). As a result a suggestions fetching is boosted up to 30-40 times for such cases.
- Converted to Dual Package, i.e. ESM and CommonJS support
- Changed Node.js support to `^10.12.0 || ^12.20.0 || ^14.13.0 || >=15.0.0`
- Changed dist modules:
    - Removed `jora.min.js`
    - Changed `jora.js` format from CJS to IIFE and applied minification
    - Added `jora.esm.js` (minified ESM module)
    - Added source maps `jora.js.map` & `jora.esm.js.map`

## 1.0.0-beta.5 (November 10, 2020)

- Jora became a superset of JSON5 (see #23)
- Added support for template literals
- Added support for multi-line comments
- Added support for hexadecimal numbers
- Added support for hexadecimal escape sequence in strings, i.e. `'hello\x20world'`
- Added support for multiple lines in strings by escaping new line characters
- Added `Infinity` and `NaN` literals
- Fixed string literal parsing to be ECMA-262 compliant
- Changed parsing to recognize line terminators according to ECMA-262 (added `\r\n`, `\u2028` and `\u2029`)
- Allowed a single trailing comma in object and array literals
- Allowed unicode escape sequence in identifier name
- Allowed object literal property names starting with `$` when a value is defined

## 1.0.0-beta.4 (November 4, 2020)

- Allowed definitions in object's literals, i.e. `{ $a: 42; foo: $a * 2, $a }` results in `{ foo: 84, a: 42 }`
- Added `setup()` API method to create a query function with defined custom methods once
- Exposed `syntax.suggest(source, parseResult)` method to get suggestion ranges based on AST and source
- Exposed `syntax.tokenize(source, tolerantMode = false)` method

## 1.0.0-beta.3 (September 20, 2020)

- Improved `sort()` to be stable for mixed types (#17)
- Added `ascN` and `descN` to define natural sorting functions
- Added `ascA` and `descA` to define sorting functions with reverse order for numbers
- Added `ascAN` and `descAN` to define natural sorting functions with reverse order for numbers h
- Improved suggestion for pipeline operator in malformed query (tolerant mode)
- Added suggestion for object keys in bracket notation property accessor
- Renamed node type `Property` to `ObjectEntry`

## 1.0.0-beta.2 (May 17, 2020)

- Fixed parse error handling

## 1.0.0-beta.1 (May 14, 2020)

- Added `[...expr]` syntax
- Added `$$` root reference (`arg1`), which refers to second parameter of closest function or `undefined` when no such
- Added `reduce()` method
- Added support for methods as a reference to definition's value, i.e. `$method: => 123; $method() or path.$method()`
- Added `syntax.walk()` API method to traverse AST
- Allowed numbers without integer part, i.e. `.123` or `.5e-4`
- Allowed numbers and literals as property name in object literals, i.e. `{ 1: 'ok', null: 'ok' }`
- Changed `=` and `!=` operators to use `Object.is()` instead of `===` and `!==` operators
- Changed behaviour for references to undefined definitions, now an exception raises in default mode, but no exceptions in tolerant mode
- Changed bracket notation (i.e. `foo[expr]`) to behave like `pick()` method
- Reworked `pick()` method:
    - Return first entry value when no argument gived
    - String values are treat as an array
    - Added support for negative indicies for array and strings
    - Return a value for object and function as reference, instead of entry
    - Pass index or key to function reference as second parameter (can be accessed by `$$`)
    - When no arguments given or reference is `undefined` for object, return first entry value instead of value with key `undefined`
    - Cast boolean values to a number index when access to an array or string, i.e. `false` -> `0` and `true` -> `1`
- Improved tolerant mode to not fail on methods that doesn't exists, such invocations silently returns `undefined`
- Improved parse and some compile errors
- Fixed suggestion in empty function body for new syntax, i.e. `group(=>)` will suggest between `=>` and `)`
- Fixed `~=` operator to produce a boolean result only
- Removed `mapToArray()` method, use `entries().({ nameProp: key, ...value })` instead
- Grand internal refactoring around AST processing:
    - Parser generates less virtual nodes, so parse->stringify is much closer to original code (white spaces and comments mostly lost)
    - Suggestion subsystem moved aside from parser to a separate module which uses in stat mode only
    - Various fixes and improvements in suggestions
    - The new approach allows to implement more complex suggestion scenarios like suggestions in array values for operators `in`, `not in`, `has` and `has no` which was added (e.g. in query `["a", "b", 1, 2][$ in ["b", 2]]` jora will suggest only `"a"` and `1` values in array after `in` operator)

## 1.0.0-alpha.13 (January 6, 2020)

- Added pipeline operator, i.e. `foo | bar | ...`
- Added `fromEntries()` method
- Allowed parent's scope variables overlapping, i.e. `$a;.($a; ...)` doesn't throw with an error now
- Added support for a function as `debug` option value, i.e. `query('...', { debug: (name, value) => /* ... */ })`
- Disallowed whitespace between `$` and identifier, previously `$foo` can be used as `$ foo`, now it throws with a parse error
- Reworked build setup:
    - Added baking of `src/parser.js` before publishing, i.e. replace a runtime parser compilation with a pre-compiled version
    - Moved `jison` to dev dependencies, and package has no dependencies anymore (dev only)
    - Removed `dist/parser.js` & `dist/version.json` from package

## 1.0.0-alpha.12 (December 18, 2019)

- Included build prerequisite files (`dist/parser.js` & `dist/version.json`) in package

## 1.0.0-alpha.11 (December 17, 2019)

- Reworked parsing to produce AST, other parts reworked to consume AST as well
- Exposed `syntax` interface with 3 methods: `syntax.parse(source, tolerantMode)`, `syntax.compile(ast, suggestRanges, statMode)` and `syntax.stringify(ast)`
- Added slice notation like [proposed](https://github.com/tc39/proposal-slice-notation/blob/master/README.md) for adding to JavaScript, e.g. `$str: '<foo>'; str[1:-1]` (`'foo'`) or `$ar:[1,2,3,4,5,6]; $ar[-3::-1]` (`[6,5,4]`) (#11)
- Added `slice(from, to)` method
- Added `split(pattern)` method
- Added `join(separator)` method
- Added `match(pattern, matchAll)` method
- Fixed method invocation on recursive mapping, i.e. `..method()` doesn't raise an error now and works as expected without surrounding parentheses (#10)
- Allowed definitions to use in parentheses, e.g. `($a: 1; $a + $a)`
- Added a function definition via `=>`, i.e. `=> body`
- Added sorting function definition with `asc` and `desc` keywords, e.g. `sort(foo asc)`, `$sorting: foo desc; sort($sorting)` or `sort(foo desc, bar asc)`
- Changed `sort()` method to use a two argument function as a regular comparator
- Removed `::self` syntax, recursion with a function defined by a variable should be used instead

## 1.0.0-alpha.10 (March 7, 2019)

- Fixed arguments context suggestion for chained methods with no arguments

## 1.0.0-alpha.9 (March 5, 2019)

- Added support for numbers with exponent
- Added support for strings as property name in object literals
- Fixed edge cases with suggestions around keywords and inside functions
- Allowed `-` and `+` operators to be unary
- Renamed `get` buildin method to `map`
- Changed `~=` operator to take any value as tester (not a regexp only); when value is a function it's behaves like `filter()`, when `null` or `undefined` it's always truthy otherwise falsy
- Changed `group()` method to group by an element when key value is an array

## 1.0.0-alpha.8 (February 7, 2019)

- Reworked tolerant parsing mode, less failures and better suggestions
- Reworked lib building, lib size reduced from 71Kb to 39Kb
- Fixed a function parsing, now it's greedy and a parentheses needed **only** around expressions with `>` operator when used outside braces, since `>` will end a function definition (i.e. `<a > 20>` causes to a parse error, but `<(a > 20)>` or `<foo.[a > 20]>` is not)
- Allowed a block inside a function, i.e. function can be empty (returns a `current` in this case) and definitions are allowed in function's body
- Added `has` and `has no` operators as inverse of `in` and `not in`
- Fixed `and` and `or` operators to evaluate left expression only once (good for performance and eliminates duplicates in suggestions)

## 1.0.0-alpha.7 (December 25, 2018)

- Disallowed a whitespace between a dot and a bracket in `.[`, `.(` and `..(` tokens
- Changed filtering (i.e. `.[]` or `filter()` method) behaviour for a non-array value to return a value itself when expression is truthy or `undefined` otherwise
- Changed semanthic `jora(query, methods?, debug?)` -> `jora(query, options?)` where `options` is `{ methods?, debug? }`
- Added stat mode (turns on by `stat` option, i.e. `jora(query, { stat: true })`) to return a query stat interface (an object `{ stat(), suggestion() }`) instead of resulting data
- Added tolerant parse mode (turns on by `tolerant` option, i.e. `jora(query, { tolerant: true })`) to supress parsing errors when possible
- Added library `version` to export
- Fixed parser edge cases for division (`/`) and regexp

## 1.0.0-alpha.6 (December 7, 2018)

- Fixed nested ternary operator precendence
- Added destuction for variables when used on object literal with no value (i.e. `{ $foo, bar: 1 }` the same as `{ foo: $foo, bar: 1 }`)
- Changed `in` and `not in` operators to propertly work with an object and a string on right side
- Changed `pick()` method to support a function as a parameter

## 1.0.0-alpha.5 (November 26, 2018)

- Added computed property names support in object literals
- Added `pick()` method
- Added bracket notation to access properties, e.g. `foo["bar"]`. It works like in JS for everything with exception for arrays, where it equivalents to `array.map(e => e[key])`. Use `pick()` method to get an element by index in array
- Added syntax to define a block scoped constant, e.g. `.($foo:$.some.path.to.cache(); bar=$foo or baz=$foo)`
- Changed single quoted string meaning to treat it as a string (used before for a property access with prohibited characters in name)
- Changed array literals to use brackets instead of parentheses
- Fixed scope issue for method arguments, a scope the same as for query root (#1)

## 1.0.0-alpha.4 (November 25, 2018)

- Added ternary operator (i.e. `a ? b : c`)
- Added operators `*`, `/` and `%`

## 1.0.0-alpha.3 (November 23, 2018)

- Changed filtering syntax to start with a dot, i.e. `[expr]` -> `.[expr]`
- Added `true`, `false`, `null` and `undefined` keywords
- Added a value argument for `mapToArray()`
- Allowed a string, a number or a regexp to be a path root
- Fixed escaping in regexp syntax

## 1.0.0-alpha.2 (September 27, 2018)

- Changed `size()` method to return own keys count for a plain object
- Fixed edge case: using an empty object inside a function
- Fixed regexp parsing (fixes #2)
- Fixed `.npmignore` to include min version to package

## 1.0.0-alpha.1 (July 18, 2018)

- Initial release
