# Dot notation

Dot notation is one of the key features that make accessing object properties simple and straightforward. Similar to JavaScript, dot notation allows you to access a property by appending the property name after a period (`.`). Jora's property access works with own properties only and uses the `.()` (or `.map()`) method under the hood (see [Mapping](./map.md) for details). For example, `foo.bar` is the same as `.(foo).(bar)`.

```jora
person.name // Accesses the `name` property of the `person` object
```

## Accessing nested properties

Dot notation can be used to access nested properties within objects as well. In the following example, we have an object with nested properties:

```jora
$person: {
  name: {
    first: 'John',
    last: 'Doe'
  },
  age: 30
};

$person.name.first
// Result: 'John'
```

By chaining dot notation, you can access properties at any depth within an object.

## Optional chaining

In Jora, optional chaining is enabled by default for both dot and bracket notations. When accessing a property that does not exist, Jora returns `undefined` instead of throwing an error.

```jora
person.address.street // Accesses the `street` property of the `address` object,
                      // returns `undefined` if `address` does not exist
```

## Accessing properties of objects in arrays

Dot notation is also used for an array to get a value of a property for every object in the array. In the following example, we create a variable `$fruits` that holds an array of objects:

```jora
$fruits: [
  { id: 1, name: 'apple' },
  { id: 2, name: 'banana' },
  { id: 3, name: 'cherry' },
  { id: 4, name: 'apple' }
];

$fruits.name
// Result: ['apple', 'banana', 'cherry']
```

As you can see, when using dot notation on an array, Jora retrieves the values of the specified property for every object in the array, producing a new array with unique values.

## Combining dot notation with other features

Dot notation can be combined with other Jora features, such as filtering, mapping, or reducing, to create powerful and expressive queries:

```jora
$items: [
    { name: 'foo', value: 1 },
    { name: 'bar', value: 2 },
    { name: 'baz', value: 3 },
    { name: 'foo', value: 4 }
];

$items.[name = 'foo'].value.sum()
// Result: 5
```

In this example, Jora first filters the items with the name 'foo', then extracts the 'value' property from each filtered item, and finally calculates the sum of these values.
