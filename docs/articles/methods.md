# Methods

In Jora, methods are functions that are invoked in a functional way. This means that the left side value (the part before a method call, or `$` if nothing is specified) is always passed as the first argument to the method. Jora has a set of built-in methods which can be extended with custom methods. Also functions can be used as a method.

## Syntax

```jora
expr.method(...args?) // `expr` can be omitted, i.e. `.method(...args?)` or `method(...args?)` are valid forms
```

## Built-in methods

Jora comes with a set of built-in methods:

| Jora method | Description
|-------------|------------
| `bool()` | Similar to `Boolean()` in JavaScript, but treats *empty arrays* and *objects with no keys* as falsy
| `keys()` | The same as `Object.keys()` in JavaScript
| `values()` | The same as `Object.values()` in JavaScript
| `entries()` | Similar to `Object.entries()` in JavaScript, using `{ key, value }` objects for entries instead of array tuples
| `fromEntries()` | Similar to `Object.fromEntries()` in JavaScript, expects `{ key, value }` objects as entries instead of array tuples
| `pick()` | Get a value by a key, index, or function. Supports negative indices for arrays and strings
| `size()` | Returns count of keys if data is an object, otherwise returns `length` value or `0` when the field is absent
| `sort(fn)` | Sort an array by a value fetched with getter (`fn`). Can use sorting function definition syntax with `asc` and `desc` (see [Sorting](./sort.md))
| `reverse()` | Reverse order of items
| `group(fn[, fn])` | Group array items by a value fetched with the first getter and return an array of `{ key, value }` entries  (see [Grouping](./group.md))
| `map(fn)` | The same as `Array#map()` in JavaScript, is equivalent to `.(fn())` (see [Mapping](./map.md))
| `filter(fn)` | The same as `Array#filter()` in JavaScript, is equivalent to `.[fn()]` (see [Filtering](./filter.md))
| `split(pattern)` | The same as `String#split()` in JavaScript. `pattern` may be a string or regex
| <nobr>`replace(pattern, replacement)`</nobr> | The same as `String#replaceAll()` in JavaScript, but also works for arrays. When `pattern` is RegExp, a `g` flags adds automatically if omitted.
| `join(separator)` | The same as `Array#join()` in JavaScript. When `separator` is not specified, `,` is used
| `slice(from, to)` | The same as `Array#slice()` and `String#slice()` in JavaScript (see also [Slice notation](./slice-notation.md))
| <nobr>`match(pattern, matchAll?)`</nobr> | Similar to `String#match()`. `pattern` might be a RegExp or string. When `matchAll` is truthy, returns an array of all occurrences of the `pattern`. Expressions `match(/../g)` and `match(/../, true)` are equivalent
| `reduce(fn[, initValue])` | The same as `Array#reduce()` in JS. Use `$$` to access the accumulator and `$` for the current value, e.g., find the max value `reduce(=>$ > $$ ? $ : $$)`
| [math] | JavaScript's [`Math`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math) methods: `abs()`, `acos()`, `acosh()`, `asin()`, `asinh()`, `atan()`, `atan2()`, `atanh()`, `cbrt()`, `ceil()`, `clz32()`, `cos()`, `cosh()`, `exp()`, `expm1()`, `floor()`, `fround()`, `hypot()`, `imul()`, `log()`, `log10()`, `log1p()`, `log2()`, `pow()`, `round()`, `sign()`, `sin()`, `sinh()`, `sqrt()`, `tan()`, `tanh()` and `trunc()`
| `toLowerCase(locales)` | The same as `String#toLocaleLowerCase()` in JavaScript
| `toUpperCase(locales)` | The same as `String#toLocaleUpperCase()` in JavaScript
| `trim()` | The same as `String#trim()` in JavaScript

## Custom methods

To provide custom methods in Jora use the following API:

```js
import jora from 'jora';

// Setup query factory with custom methods
const createQueryWithCustomMethods = jora.setup({
    myMethod($) {
        /* do something and return a new value */
    }
});

// Create a query
const queryWithMyMethod = createQueryWithCustomMethods('foo.myMethod()');
```

## Functions as a method

A function can be stored in a local variable and then used it the same way as a regular method:

```jora
$method: => /* do something */;

expr.$method(...args?) // or .$method(...args?) or $method(...args?)
```

The following example demonstrates how to sum up an array using a function as a method:

```jora
$sum: => .reduce(=> $$ + $, 0); // The same as $.reduce(...)

[1, 2, 3, 4].$sum() // Returns 10
```

An equivalent JavaScript for the query:

```js
function $sum($) {
    // Take into account that in Jora, the order of arguments in functions is always `$, $$`,
    // but in JavaScript's reduce() method has reversed order of arguments
    return $.reduce(($$, $) => $$ + $, 0);
}

$sum([1, 2, 3, 4])
```

## Calling functions from context or data

There is no syntax in Jora to directly call a function passed via context or data. However, you can store a function in a local variable and then use it as a method:

```jora
$fn: #.functionFromContext;

someValue.$fn()
```
