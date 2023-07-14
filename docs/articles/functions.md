# Functions

There are two ways to define a function in Jora: a regular function and a comparator function (which used to compare a couple of values).

## Regular functions

A function defintion looks like an arrow function in JavaScript but without arguments:

```jora
=> expr
```

Usually functions are used in place as an argument of methods:

```jora
[1, 2, 3, 4].group(=> $ % 2)
// Result: [{ key: 1, value: [1, 3] }, { key: 0, value: [2, 4]}]
```

A function can be stored in a local variable and then used it the same way as a regular method:

```jora
$countOdd: => .[$ % 2].size();
[1, 2, 3, 4].$countOdd()
// Result: 2
```

Despite the fact that a function definition has no arguments, two special variables are available in the scope of the function: `$` (first parameter) and `$$` (second parameter).

```jora
$example: => [$, $$];
1.$example(2)
// Result: [1, 2]
```

The following example demonstrates how to sum up an array using [`reduce()`](./methods-builtin.md#reducefn-initvalue) method and a function, where `$` is an array element and `$$` is an accumulator value:

```jora
[1, 2, 3, 4].reduce(=> $$ + $, 0)
// Result: 10
```

An equivalent JavaScript for the query:

```js
// Take into account that in Jora, the order of arguments in functions is always `$, $$`,
// but in JavaScript's reduce() method has reversed order of arguments
[1, 2, 3, 4].reduce(($$, $) => $$ + $, 0)
```

There is no syntax to directly call a function passed via context or data. However, a function in a local variable and then use it as a method:

```jora
$functionFromContext: #.example;
someValue.$functionFromContext()
```

## Comparator functions

There is a syntax to define comparator functions – functions that return `-1`, `0`, or `1`, based on whether the first value in a pair is lesser, equal to, or greater than the second. The syntax produces a function which takes two arguments and compare the query result for each in the specified order (`asc` or `desc`):

```jora
expr asc
// Result (JS equivalent): (a, b) => expr(a) > expr(b) ? 1 : expr(a) < expr(b) ? -1 : 0
```

```jora
expr desc
// Result (JS equivalent): (a, b) => expr(a) < expr(b) ? 1 : expr(a) > expr(b) ? -1 : 0
```

A comma-separated sequence defines a single function:

```jora
foo asc, bar.size() desc
// Result (JS equivalent):
//   (a, b) =>
//     a.foo > b.foo ? 1 : a.foo < b.foo ? -1 :
//     size(a.bar) < size(b.bar) ? 1 : size(a.bar) > size(b.bar) ? -1 :
//     0
```

These functions are useful for built-in methods like [`sort()`](./sort.md), [`min()`](./methods-builtin.md#mincompare), [`max()`](./methods-builtin.md#maxcompare) and others.

```jora
$input: [{ foo: 3 }, { foo: 1 }, { foo: 5 }];
$input.sort(foo desc)
// Result: [{ foo: 5 }, { foo: 3 }, { foo: 1 }]
```

Before comparing a pair of values, a comparator function compares their types. When types are different, a comparator returns a result of types comparison, since comparing let say a number and an object makes no sense. In other words, an object value is always bigger than a number, and a boolean is always lower than a string:

1. boolean
2. NaN
3. number
4. string
5. null
6. object
7. other
8. undefined

There are some variations for `asc` and `desc` that provide additional comparison options:

- `ascN` / `descN`: [Natural sort order](https://en.wikipedia.org/wiki/Natural_sort_order) for strings using [@discoveryjs/natural-compare](https://github.com/discoveryjs/natural-compare) (`N` stands for "Natural")
- `ascA` / `descA`: The same as `asc` / `desc`, but reverse order for numbers (`A` stands for "Analytical")
- `ascAN` / `ascNA` / `descAN` / `descNA`: The same as `ascN` / `descN`, but reverse order for numbers (`AN` stands for "Analytical" and "Natural")
