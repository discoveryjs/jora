# Basics

Jora is a query language designed for JSON-like data structures. It extends JSON5 and shares many similarities with JavaScript. 

## Expressions
    
Jora expressions are the building blocks of Jora queries. Expressions can include literals, operators, functions, and variables.

## Comments

```js
// single-line comment
/* multi-line
comment */
```

## Literals

Jora supports literals, which include:

- Numbers: `42`, `-3.14`, `6.022e23`
- Strings: `"hello"`, `'world'`, `"\u{1F600}"`
- Booleans: `true`, `false`
- Regular expressions: `/regexp/flags`
- Object literals: `{ hello: 'world' }` (see [Object literals](./object-literal.md))
- Array literals: `[1, 2, 3]` (see [Array literals](./array-literal.md))
- `null` and `undefined`
- ... and others
    
See [Literals](./literals.md)

## Operators

Jora supports most JavaScript operators, including:

- Arithmetic: `+`, `-`, `*`, `/`, `%`
- Comparison: `=`, `!=`, `<`, `<=`, `>`, `>=`
- Logical: `and`, `or`, `not`
- Ternary: `?:`
- ... and others

See [Operators](./operators.md)

## Dot and Bracket Notations

Jora provides two notations for accessing object properties and array elements: dot notation and bracket notation. Dot notation is similar to JavaScript's property access notation, using a period followed by the property name (e.g., `$.propertyName`). Bracket notation, on the other hand, encloses the property name or index within square brackets (e.g., `$['propertyName']` or `$[0]`). Jora's bracket notation also allows you to use functions for dynamic property access and supports optional chaining by default.

- [Dot notation](./dot-notation.md)
- [Bracket notation](./bracket-notation.md)

## Methods and functions

Jora provides a rich set of built-in methods for manipulating data, such as `.map()`, `.filter()`, `.group()`, `.sort()`, `.reduce()`, and many others. You can also define custom functions using the `=>` arrow function syntax.

- [Methods](./articles/methods.md)
- [Grouping](./articles/group.md): `group()` method
- [Sorting](./articles/sort): `sort()` method

## Mapping and Filtering

Jora has a concise syntax for mapping and filtering arrays. The `.map(fn)` method is equivalent to `.(fn())`, while the `.filter(fn)` method is equivalent to `.[fn()]`. This compact syntax makes it easy to transform and filter data.

- [Mapping](./articles/map.md): `.(...)` and `map()` method
- [Filtering](./articles/filter.md): `.[...]` and `filter()` method

## Variables

Variables in Jora are helpful for storing intermediate results or simplifying complex expressions. To define a variable, use the `$variableName: expression;` syntax.

See [Variables](./variables.md)
