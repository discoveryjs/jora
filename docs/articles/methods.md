# Methods Usage in Jora

In Jora, methods are functions that are invoked in a functional way. This means that the left side value (the part before a method call, or `$` if nothing is specified) is always passed as the first argument to the method. Jora has a set of built-in methods, and you can also create custom methods to extend its functionality.

## Syntax

```jora
expr.method(...args?) // or .method(...args?) or method(...args?)
```

## Built-in Methods

Jora comes with a set of built-in methods that you can use in your queries. Some Jora build-in methods:

| Jora method | Description
|-------------|------------
| bool() | Similar to `Boolean()` in JS, but treats *empty arrays* and *objects with no keys* as falsy
| keys() | The same as `Object.keys()` in JS
| values() | The same as `Object.values()` in JS
| entries() | Similar to `Object.entries()` in JS, using `{ key, value }` objects for entries instead of array tuples
| fromEntries() | Similar to `Object.fromEntries()` in JS, expects `{ key, value }` objects as entries instead of array tuples
| pick() | Get a value by a key, index, or function. Supports negative indices for arrays and strings
| size() | Returns count of keys if data is an object, otherwise returns `length` value or `0` when the field is absent
| sort(fn) | Sort an array by a value fetched with getter (`fn`). Can use sorting function definition syntax with `asc` and `desc
| reverse() | Reverse order of items
| group(fn[, fn]) | Group array items by a value fetched with the first getter and return an array of `{ key, value }` entries  (see [Grouping](./group.md))
| map(fn) | The same as `Array#map()` in JS, is equivalent to `.(fn())` (see [Mapping](./map.md))
| filter(fn) | The same as `Array#filter()` in JS, is equivalent to `.[fn()]` (see [Filtering](./filter.md))
| split(pattern) | The same as `String#split()` in JS. `pattern` may be a string or regex
| join(separator) | The same as `Array#join()` in JS. When `separator` is not specified, `,` is used
| slice(from, to) | The same as `Array#slice()` and `String#slice()` in JS
| match(pattern, matchAll?) | Similar to `String#match()`. `pattern` might be a RegExp or string. When `matchAll` is truthy, returns an array of all occurrences of the `pattern`. Expressions `match(/../g)` and `match(/../, true)` are equivalent
| reduce(fn[, initValue]) | The same as `Array#reduce()` in JS. Use `$$` to access the accumulator and `$` for the current value, e.g., find the max value `reduce(=>$ > $$ ? $ : $$)`

## Custom Methods

To create custom methods in Jora, you can use the following API:

```js
import jora from 'jora';

// Setup query factory with custom methods
const createQueryWithCustomMethods = jora.setup({
    myMethod($) { /* do something and return a new value */ }
});

// Create a query
const queryWithMyMethod = createQueryWithCustomMethods('foo.myMethod()');
```

## Storing Functions in local variables

You can store a function in a local variable and then use it the same way as a regular method:

```jora
$method: => /* do something */;

expr.$method(...args?) // or .$method(...args?) or $method(...args?)
```

### Example: Summing up an array

```jora
$sum: => .reduce(=> $$ + $, 0); // the same as $.reduce(...)

[1, 2, 3, 4].$sum() // returns 10
```

An equivalent JavaScript for the query:

```js
function $sum($) {
    // take into account that in Jora, the order of arguments in functions is always `$, $$`,
    // but in JavaScript's reduce() method has reversed order of arguments
    return $.reduce(($$, $) => $$ + $, 0);
}

$sum([1, 2, 3, 4])
```

## Calling functions from context or data

There is no syntax in Jora to directly call a function passed via context or data. However, you can store a function in a local definition and then use it:

```jora
$fn: #.functionFromContext;

someValue.$fn()
```

With this approach, you can leverage functions passed via context or data in your Jora queries, expanding the possibilities of your data manipulation tasks.
