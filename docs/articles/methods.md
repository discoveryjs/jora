# Methods

In Jora, methods are functions that are invoked in a functional way. This means that the left side value (the part before a method call, or `$` if nothing is specified) is always passed as the first argument to the method. Jora has a set of built-in methods which can be extended with custom methods. Also functions can be used as a method.

## Syntax

```jora
expr.method(...args?) // `expr` can be omitted, i.e. `.method(...args?)` or `method(...args?)` are valid forms
```

## Built-in methods

Jora comes with a set of built-in methods which perform most common operations on data. There is an example of using `group()`, `sort()` and `size()` methods:

```jora
group(=> name)
    .({ name: key, records: value })
    .sort(records.size() desc)
```

See [Built-in methods](./methods-builtin.md).

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
