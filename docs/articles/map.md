# Mapping: `.(...)` and `map()` method

The **mapping** in Jora allows you to create a new array by transforming the elements of the given array with a provided function. This is achieved using the `.(...)` syntax and `map()` method.

Jora's map method works not only with arrays but also with primitive types and objects, making it incredibly versatile for various data transformation tasks. Note that the map method produces unique values and ignores `undefined` values, meaning that the resulting array might have a smaller length than the original array. If an expression returns an array, its result is concatenated with the overall result, possibly leading to a larger resulting array than the original.

## Syntax

```
.map(fn) // or .map(=> expr)
.(block)
```

## Examples

- [Pick object properties](#pick-object-properties)
- [Pick property values](#pick-property-values)
- [Rename property](#rename-property)
- [Mapping a number](#mapping-a-number)
- [Copying over the object with spread and computing additional properties](#copying-over-the-object-with-spread-and-computing-additional-properties)
- [Map method returns unique values](#map-method-returns-unique-values)
- [Concatenating arrays with overall result](#concatenating-arrays-with-overall-result)
- [Ignoring `undefined` values](#ignoring-undefined-values)
    - [In a simple array](#in-a-simple-array)
    - [In an array of objects](#in-an-array-of-objects)
    - [In an array of nested objects](#in-an-array-of-nested-objects)
- [Workaround to keep the same number of elements as in input array](#workaround-to-keep-the-same-number-of-elements-as-in-input-array)

### Pick object properties

Suppose we are only interested in the value of the `"baz"` property in the input objects.

`Input`

```json
[
    { "foo": "bar", "baz": 1 },
    { "foo": "bar", "baz": 2 },
    { "foo": "bar", "baz": 3 }
]
```

`Query`

```jora
.({ baz })
```

or

```jora
.map(=> { baz })
```

`Output`

```json
[
    { "baz": 1 },
    { "baz": 2 },
    { "baz": 3 }
]
```

### Pick property values

Suppose we want to convert our array of objects into an array of `"baz"` values:

`Input`

```json
[
    { "baz": 1 },
    { "baz": 2 },
    { "baz": 3 }
]
```

`Query`

```jora
.(baz)
```

or

```jora
.map(=> baz)
```

or simply

```jora
.baz
```

`Output`

```json
[ 1, 2, 3 ]
```

### Rename property

`Input`

```json
[
    { "a": 42 },
    { "a": 42 },
    { "a": 42 }
]
```

`Query`

```jora
.({ answer: a })
```

or

```jora
.map(=> { answer: a })
```

`Output`

```json
[
    { "answer": 42 },
    { "answer": 42 },
    { "answer": 42 }
]
```

### Mapping a number

In Jora, the map operation can apply to numbers, strings, etc. For example, you can take a primitive value and store it in an object:

`Input`

```json
123
```

`Query`

```jora
.({ foo: $ })
```

or

```jora
.map(=> { foo: $ })
```

> **Note:** In the above example, `$` references the current value.

`Output`

```json
{ "foo": 123 }
```

### Copying over the object with spread and computing additional properties

Jora's map method can also be applied to objects.

`Input`

```json
{ "foo": 41 }
```

`Query`

```jora
.({ ..., answer: foo + 1 })
```

or

```jora
.map(=> { ..., answer: foo + 1 })
```

`Output`

```json
{
    "foo": 41,
    "answer": 42
}
```

### Map method returns unique values

When using the map method in Jora, it automatically returns unique values in the resulting array, which can lead to a smaller output array than the input array. Let's consider an example:

`Input`

```json
[ 1, 2, 2, 3, 3, 3 ]
```

`Query`

```jora
.map(=> $)
```

`Output`

```json
[ 1, 2, 3 ]
```

As you can see, the duplicate values in the input array were removed in the output array.

### Concatenating arrays with overall result

If an expression in the map method returns an array, the resulting array will be concatenated with the overall result. This may lead to a larger output array than the input array. Let's consider an example:

`Input`

```json
[
    { "values": [1, 2] },
    { "values": [3, 4] }
]
```

`Query`

```jora
.(values)
```

`Output`

```json
[ 1, 2, 3, 4 ]
```

As you can see, the output array is a concatenation of the `values` arrays from the input objects.

## Ignoring `undefined` values

The map method in Jora automatically ignores `undefined` values when processing an array. This feature can be useful when you want to filter out `undefined` values from the result while mapping an array of objects where some objects do not have a specified property.

### In a simple array

```js
[ 1, undefined, 3 ]
```

`Query`

```jora
.($)
```

`Output`

```json
[ 1, 3 ]
```

### In an array of objects

```json
[ { "a": 1 }, { }, { "a": 3 } ]
```

`Query`

```jora
.(a)
```

`Output`

```json
[ 1, 3 ]
```

### In an array of nested objects

```json
[ { "a": { "nested": 1 } }, { }, { "a": 3 } ]
```

`Query`

```jora
.(a.nested)
```

`Output`

```json
[ 1 ]
```

In the above examples, we can see how Jora's map method handles `undefined` values, effectively filtering them out of the output while preserving the values that are not `undefined`.

## Workaround to keep the same number of elements as in input array

In some cases, you might want to preserve the same number of elements in the output array as in the input array. You can use a simple workaround by wrapping the result of the map method into an object. Let's consider an example:

`Input`

```json
[ 1, 2, 2, 3, 3, 3 ]
```

`Query`

```jora
.({ value })
```

`Output`

```json
[
  { "value": 1 },
  { "value": 2 },
  { "value": 2 },
  { "value": 3 },
  { "value": 3 },
  { "value": 3 }
]
```

In this example, we wrap the result of the map method into an object with a `value` property, which results in an output array with the same number of elements as the input array.
