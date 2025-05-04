# Syntax overview

Jora is a query language designed for JSON-like data structures. It extends [JSON5](https://json5.org/) and shares many similarities with JavaScript.

## Expressions

Jora expressions are the building blocks of Jora queries. Expressions can include comments, literals, operators, functions, and variables.

## Comments

```js
// single-line comment
/* multi-line
comment */
```

## Literals

Jora supports literals, which include:

- Numbers: `42`, `-3.14`, `6.022e23`
- Strings: `"hello"`, `'world'`, `{{"\u0060template${string}\u0060"}}`, `"\u{1F600}"`
- Booleans: `true`, `false`
- Regular expressions: `/regexp/flags`
- Object literals: `{ hello: 'world' }` (see [Object literals](./object-literal.md))
- Array literals: `[1, 2, 3]` (see [Array literals](./array-literal.md))
- Functions: `=> …` (see [Functions](./functions.md))
- Keywords: `NaN`, `Infinity`, `null` and `undefined`
    
See [Literals](./literals.md)

## Operators

Jora supports most JavaScript operators, including:

- Arithmetic: `+`, `-`, `*`, `/`, `%`
- Comparison: `=`, `!=`, `<`, `<=`, `>`, `>=`, `~=`
- Logical: `and`, `or`, `not` (alias `no`), `??`, `is`, `in`, `not in`, `has`, `has no`
- Ternary: `?:`
- Grouing: `( )`
- Pipeline: `|`

See [Operators](./operators.md)

## Dot, bracket and slice notations

Jora provides notations for accessing properties and elements: dot, bracket and slice notations. Dot notation is similar to JavaScript's property access notation, using a period followed by the property name (e.g., `$.propertyName`). Bracket notation encloses the property name or index within square brackets (e.g., `$['propertyName']` or `$[0]`), it's also possible to use functions to choose. Slice notation provides a concise syntax to slice elements with optional step (`array[5:10:2]` selects each odd element from 5th to 10th indecies).

- [Dot notation](./dot-notation.md)
- [Bracket notation](./bracket-notation.md)
- [Slice notation](./slice-notation.md)

## Methods and functions

Jora provides a rich set of built-in methods for manipulating data, such as `map()`, `filter()`, `group()`, `sort()`, `reduce()`, and many others. You can also define custom functions using the `=>` arrow function syntax, and use them as a method.

- [Methods](./methods.md)
- [Built-in methods](./methods-builtin.md)
- [Grouping](./group.md): `group()` method
- [Sorting](./sort.md): `sort()` method

## Mapping and filtering

Jora has a concise syntax for mapping and filtering. The `map(fn)` method is equivalent to `.(fn())`, while the `filter(fn)` method is equivalent to `.[fn()]`.

- [Mapping](./map.md): `.(…)` and `map()` method
- [Recursive mapping](./recursive-map.md): `..(…)`
- [Filtering](./filter.md): `.[…]` and `filter()` method

## Variables

Variables in Jora are helpful for storing intermediate results or simplifying complex expressions. To define a variable, use the `$variableName: expression;` syntax.

See [Variables](./variables.md)
