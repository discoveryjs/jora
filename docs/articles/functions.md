# Functions

There are two ways to define a function in Jora:
- a [regular function](#regular-functions)
- a [comparator function](#comparator-functions) (which used to compare a couple of values).

## Regular functions

Jora's function syntax is akin to JavaScript's arrow functions but with distinct characteristics:

- **Optional arguments**: The inclusion of arguments is not mandatory.
- **Argument naming**: All argument names must begin with `$`, such as `$foo` or `$bar`.
- **No default argument values**: Jora does not support default values for function arguments.
- **No rest parameters**: Syntax like `(...$args) => expression` is prohibited.
- **Special variables `$` and `$$`**: Regardless of whether arguments are defined, `$` always represents the first argument, and `$$` the second. For instance, in `($a, $b) => $ = $a and $$ = $b`, `$` equals `$a` (until a scope change) and `$$` equals `$b`.

Supported function forms in Jora include:

```jora
=> expr
```
```jora
$arg => expr
```
```jora
() => expr
```
```jora
($arg) => expr
```
```jora
($arg1, $arg2) => expr
```

Functions are often used in place as method arguments:

```jora
[1, 2, 3, 4].group(=> $ % 2)
// Result: [{ key: 1, value: [1, 3] }, { key: 0, value: [2, 4]}]
```

Functions can also be stored as local variables:

```jora
$oddEven: => $ % 2;
[1, 2, 3, 4].group($oddEven)
// Result: [{ key: 1, value: [1, 3] }, { key: 0, value: [2, 4]}]
```

Functions stored as local variables can also be used as regular methods:

```jora
$countOdd: => .[$ % 2].size();
[1, 2, 3, 4].$countOdd()
// Result: 2
```

To use a function passed via context (`#`) or data (`@`), store it in a local variable and then use it as a method:

```jora
$functionFromContext: #.someFunction;
someValue.$functionFromContext()
```

Explicit argument declaration is beneficial when an argument is used in nested scopes within the function body:

```jora
$books: [
    { id: 1, title: "To Kill a Mockingbird", author: "Harper Lee" },
    { id: 2, title: "1984", author: "George Orwell" },
    { id: 3, title: "The Great Gatsby", author: "F. Scott Fitzgerald" }
];
$getBook: $id => $books[=> id = $id];
3 | $getBook()
// Result: { id: 3, title: "The Great Gatsby", author: "F. Scott Fitzgerald" }
```

The special variables `$` (first parameter) and `$$` (second parameter) are always accessible in function scope:

```jora
$example: => [$, $$];
1.$example(2)
// Result: [1, 2]
```

Declaring arguments does not alter the behavior of `$` and `$$`:

```jora
$example: ($a, $b) => [$a, $, $b, $$];
1.$example(2)
// Result: [1, 1, 2, 2]
```

Here's how to sum up an array using the [`reduce()`](./methods-builtin.md#reduce) method and a function, where `$` is the array element and `$$` is the accumulator:

```jora
[1, 2, 3, 4].reduce(=> $$ + $, 0)
// Result: 10
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

These functions are useful for built-in methods like [`sort()`](./sort.md), [`min()`](./methods-builtin.md#min), [`max()`](./methods-builtin.md#max) and others.

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

- `ascN` and `descN`: [Natural sort order](https://en.wikipedia.org/wiki/Natural_sort_order) for strings using [@discoveryjs/natural-compare](https://github.com/discoveryjs/natural-compare) (`N` stands for "Natural")
- `ascA` and `descA`: The same as `asc` and `desc`, but reverse order for numbers (`A` stands for "Analytical")
- `ascAN`, `ascNA`, `descAN` and `descNA`: The same as `ascN` and `descN`, but reverse order for numbers (`AN` stands for "Analytical" and "Natural")
