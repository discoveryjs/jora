## next

- Added support a function for `debug` option, i.e. `query('...', { debug: (name, value) => /* ... */ })`
- Disallowed whitespace between `$` and identifier, now it throws a parse error
- Allowed parent's scope variables overlapping, i.e. `$a;.($a; ...)` doesn't throw an error now
- Added `fromEntries()` method
- Added pipeline operator, i.e. `foo | bar | ...`
- Reworked build:
    - Added baking `src/parser.js` before publishing, i.e. replace runtime parser compilation with a compiled version
    - Moved `jison` to dev dependencies, package has no dependencies now (dev only)
    - Removed `dist/parser.js` & `dist/version.json` from package

## 1.0.0-alpha.12 (December 18, 2019)

- Included build prerequisite files (`dist/parser.js` & `dist/version.json`) in package

## 1.0.0-alpha.11 (December 17, 2019)

- Reworked parsing to produce AST, other parts reworked to consume AST as well
- Exposed `syntax` interface with 3 methods: `parse(source, tolerantMode)`, `compile(ast, suggestRanges, statMode)` and `stringify(ast)`
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
- Changed filter (i.e. `.[]` or `.filter()`) behaviour for a non-array value to return a value itself when expression is truthy or `undefined` otherwise
- Changed semanthic `jora(query, methods?, debug?)` -> `jora(query, options?)` where `options` is `{ methods?, debug? }`
- Added stat mode (turns on by `stat` option, i.e. `jora(query, { stat: true })`) to return a query stat interface (an object with `stat()` and `suggestion()` methods) instead of resulting data
- Added tolerant parse mode (turns on by `tolerant` option, i.e. `jora(query, { tolerant: true })`) to supress parsing errors when possible
- Added library `version` to export
- Fixed parser edge cases for division (`/`) and regexp

## 1.0.0-alpha.6 (December 7, 2018)

- Fixed nested ternary operator precendence
- Added destuction for variables when used on object literal with no value (i.e. `{ $foo, bar: 1}` the same as `{ foo: $foo, bar: 1 }`)
- Changed `in` and `not in` operators to propertly work with an object and a string on right side
- Added support for a function as a parameter for `pick()` method

## 1.0.0-alpha.5 (November 26, 2018)

- Added computed property names support in object literals
- Added `pick()` method
- Added array-like notation to access properties, e.g. `foo["bar"]`. It works like in JS for everything with exception for arrays, where it equivalents to `array.map(e => e[key])`. Use `pick()` method to get an element by index in array
- Added syntax to define a block scoped constant, e.g. `.($foo:$.some.path.to.cache(); bar=$foo or baz=$foo)`
- Changed single quoted string meaning to treat it as a string (used before for a property access with prohibited characters in name)
- Changed array literals to use brackets instead of parentheses
- Fixed scope issue for method arguments, a scope the same as for query root (#1)

## 1.0.0-alpha.4 (November 25, 2018)

- Added ternary operator (i.e. `a ? b : c`)
- Added operators `*`, `/` and `%`

## 1.0.0-alpha.3 (November 23, 2018)

- Changed filter syntax to start with a dot, i.e. `[expr]` -> `.[expr]`
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
