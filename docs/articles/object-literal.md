# Object literals

Jora, being a superset of JSON5, supports object literals as an integral part of its syntax. Object literals provide a convenient way to define and manipulate complex data structures. This article covers the basics of object literals in Jora, including their syntax, usage, computed properties, spread operator, and the `entries()` and `fromEntries()` methods.

- [Syntax](#syntax)
- [Computed properties](#computed-properties)
- [Spread operator](#spread-operator)
- [`entries()` and `fromEntries()` methods](#entries-and-fromentries-methods)

## Syntax

Object literals in Jora follow the familiar syntax found in JSON5 and JavaScript. They are enclosed in curly braces `{}` and consist of key-value pairs, with keys being strings and values being any valid Jora expression. Here's an example of a simple object literal:

```jora
{
  name: "John Doe",
  age: 30,
  isActive: true
}
```

In Jora, keys in object literals don't need to be wrapped in quotes unless they contain special characters, spaces, or start with a digit. Also, it's possible to use a shorthand syntax for key-value pairs when the key and the value have the same name:

```jora
$city: "New York";
$country: "USA";

{
  $city,
  $country
}
```

This is equivalent to:

```jora
{
  city: $city,
  country: $country
}
```

### Computed properties

Jora supports computed properties in object literals, allowing you to create dynamic keys based on expressions. To use computed properties, wrap the key expression in square brackets `[]`. Here's an example:

```jora
{
  ['city' + 'Code']: "NYC"
}
```

This results in:

```json
{
  "cityCode": "NYC"
}
```

### Spread operator

The spread operator (`...`) is used in Jora to merge properties from one object into another. It can be used with a variable or an expression that evaluates to an object:

```jora
$foo: { a: 1, b: 2 };
$bar: { b: 3, c: 4 };

{
  ...$foo,
  ...$bar
}
```

This results in:

```json
{
  "a": 1,
  "b": 3,
  "c": 4
}
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
```

The query will result in:

```json
[
  { "id": 1, "name": "Alice", "active": true },
  { "id": 2, "name": "Bob", "active": true }
]
```

In this example, the spread operator (`...`) without an expression following it represents the current value (`$`) within the mapping function, which is each user object in the `$users` array. The resulting object includes all the properties from the original user object along with the additional `active: true` property.

## `entries()` and `fromEntries()` methods

Jora provides two methods, `entries()` and `fromEntries()`, to work with object literals more effectively:

1. `entries()`: This method is similar to `Object.entries()` in JavaScript. It returns an array of `{ key, value }` objects, where `key` is the property name and `value` is the associated value from the input object. Here's an example:

```jora
{ a: 1, b: 2, c: 3 }.entries()
```

This results in:

```json
[
  { "key": "a", "value": 1 },
  { "key": "b", "value": 2 },
  { "key": "c", "value": 3 }
]
```

2. `fromEntries()`: This method is the inverse of `entries()` and is similar to `Object.fromEntries()` in JavaScript. It takes an array of `{ key, value }` objects and returns an object with properties corresponding to those keys and values. Here's an example:

```jora
[
  { key: "a", value: 1 },
  { key: "b", value: 2 },
  { key: "c", value: 3 }
].fromEntries()
```

This results in:

```json
{
  "a": 1,
  "b": 2,
  "c": 3
}
```

These methods are particularly useful when working with dynamic properties, transforming objects, or when combining multiple objects based on specific conditions.
