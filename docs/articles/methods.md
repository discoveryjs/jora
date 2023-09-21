# Methods

In Jora, methods are functions that are invoked in a functional way. This means that the left side value (the part before a method call, or `$` if nothing is specified) is always passed as the first argument to the method. Jora has a set of built-in methods which can be extended with custom methods. Also functions can be used as a method.

## Syntax

```jora
expr.method(...args)
```

> Note: `expr` can be omitted, i.e. `.method(...args)` or `method(...args)` are also valid forms

## Built-in methods

Jora comes with a set of built-in methods which perform most common operations on data. There is an example of using `group()`, `sort()` and `size()` methods:

```jora
group(=> name)
    .({ name: key, records: value })
    .sort(records.size() desc)
```

See [Built-in methods](./methods-builtin.md).

## Custom methods

To define custom methods in Jora use the following API:

```js
import jora from 'jora';

// Setup query factory with custom methods
const createQueryWithCustomMethods = jora.setup({
    methods: {
        myMethod($) {
            /* do something and return a new value */
        }
    }
});

// Create a query
const queryWithMyMethod = createQueryWithCustomMethods('foo.myMethod()');
```
