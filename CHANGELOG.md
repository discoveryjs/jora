## next

- Fixed nested ternary operator precendence
- Added destuction for variables when used on object literal with no value (i.e. `{ $foo, bar: 1}` the same as `{ foo: $foo, bar: 1 }`)

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
