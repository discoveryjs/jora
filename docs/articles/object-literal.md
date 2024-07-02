# Object literals

Jora supports object literals as an integral part of its syntax. Object literals provide a convenient way to define and manipulate complex data structures.

- [Syntax](#syntax)
- [Computed properties](#computed-properties)
- [Shorthand syntax for entries](#shorthand-syntax-for-entries)
- [Spread operator](#spread-operator)
- [Object entry list methods](#object-entry-list-methods)

## Syntax

Object literals in Jora follow the familiar syntax found in JSON5 and JavaScript. They are enclosed in curly braces `{}` and consist of key-value pairs, with keys being strings and values being any valid Jora expression. In Jora, keys in object literals don't need to be wrapped in quotes unless they contain special characters, spaces, or start with a digit. Here's an example of a simple object literal:

```jora
{
    "name": "John Doe",
    'age': 30,
    isActive: true
}
```

## Computed properties

Jora supports computed properties in object literals, allowing you to create dynamic keys based on expressions. To use computed properties, wrap the key expression in square brackets `[]`. Here's an example:

```jora
$prefix: 'city';

{
    [$prefix + 'Code']: "NYC"
}
// Result: { cityCode: "NYC" }
```

## Shorthand syntax for entries

When the value of an entry starts with an identifier, method call, or variable, the key name can be inferred and omitted:

```jora
$city: "New York";

{ hello: 'world' } | {
    hello,
    $city,
    size()
}
// Result: { hello: 'world', city: 'New York', size: 1 }
```

This is equivalent to:

```jora
$city: "New York";

{ hello: 'world' } | {
    hello: hello,
    city: $city,
    size: size()
}
// Result: { hello: 'world', city: 'New York', size: 1 }
```

Using shorthand syntax for methods is particularly useful when multiple aggregation functions need to be called on the same array:

```jora
[1, 3, 2] | { min(), max(), sum(), avg() }
// Result: { min: 1, max: 3, sum: 6, avg: 2 }
```

Shorthand syntax can follow any expression, transforming from `name expr` into `name: name | expr` (see [Pipeline Operator](./operators.md#pipeline-operator)):

```jora
{
    foo.[x > 5],        // equivalent to: `foo: foo | .[x > 5]`
    bar size() * 2,     // equivalent to: `bar: bar | size() * 2`
    baz is number ?: 0, // equivalent to: `baz: baz | is number ?: 0`
    $var.size(),        // equivalent to: `var: var | .size()`
    sort() reverse()    // equivalent to: `sort: sort() | reverse()`
}
```

Note that an expression can't start with an operator because it will cause a syntax error. However, starting with `+` (unary plus) and `-` (unary minus) does not lead to a syntax error but produces a scalar, discarding the base value:

```jora
[1, 2, 3] | {
    size() + 10  // equivalent to: `size: size() | +10`
} 
// Result: { size: 10 }
```

## Spread operator

The spread operator (`...`) is used in Jora to merge properties from one object into another. It can be used with a variable or an expression that evaluates to an object:

```jora
$foo: { a: 1, b: 2 };
$bar: { b: 3, c: 4 };

{
    ...$foo,
    ...$bar
}

// Result: {
//     "a": 1,
//     "b": 3,
//     "c": 4
// }
```

The spread operator can be used without an expression following it, which essentially means that it will spread the current value (`$`). In this case, the spread operator is equivalent to using `...$`. This shorthand is helpful when you want to merge an object with the current value in a concise manner. Here's an example: suppose we have a list of users, and we want to add an additional property (`active: true`) to each user object. We can use the spread operator to achieve this:

```jora
$users: [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
];

$users.({
    ..., // The same as ...$
    active: true
})

// Result: [
//     { "id": 1, "name": "Alice", "active": true },
//     { "id": 2, "name": "Bob", "active": true }
// ]
```

In this example, the spread operator (`...`) without an expression following it represents the current value (`$`) within the mapping function, which is each user object in the `$users` array. The resulting object includes all the properties from the original user object along with the additional `active: true` property.

## Object entry list methods

The following methods are used to retrieve a list of entries from an object or to reconstruct an object from a list of entries:

1. [`entries()`](./methods-builtin.md#entries): This method is similar to `Object.entries()` in JavaScript. It returns an array of `{ key, value }` objects, where `key` is the property name and `value` is the associated value from the input object. Here's an example:

```jora
{ a: 1, b: 2, c: 3 }.entries()

// Result: [
//     { "key": "a", "value": 1 },
//     { "key": "b", "value": 2 },
//     { "key": "c", "value": 3 }
// ]
```

2. [`fromEntries()`](./methods-builtin.md#fromentries): This method is the inverse of `entries()` and is similar to `Object.fromEntries()` in JavaScript. It takes an array of `{ key, value }` objects and returns an object with properties corresponding to those keys and values. Here's an example:

```jora
[
    { key: "a", value: 1 },
    { key: "b", value: 2 },
    { key: "c", value: 3 }
].fromEntries()

// Result: {
//     "a": 1,
//     "b": 2,
//     "c": 3
// }
```
