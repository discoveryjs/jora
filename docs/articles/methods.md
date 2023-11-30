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

Jora queries can be enchanced by defining custom methods (see [Enhancing queries with custom methods and assertions](./api.md#enhancing-queries-with-custom-methods-and-assertions)):

```js
import jora from 'jora';

// Create a custom setup for queries
const queryWithCustomMethods = jora.setup({
    methods: {
        customMethod($) { /* implement custom logic here */ }
    }
});

// Use the custom query factory
queryWithCustomMethods('foo.customMethod()')(data, context);
```
