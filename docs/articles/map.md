# Mapping: `.(...)` and `map()` method

The **mapping** in Jora allows you to create a new array by transforming the elements of the given array with a provided function. This is achieved using the `.(...)` syntax or `map()` method.

Jora's mapping works not only with arrays but also with primitive types and objects. Note that the map method produces unique values, meaning that the resulting array might have a smaller length than the original array. If an expression returns an array, its result is concatenated with the overall result ignoring `undefined` values, possibly leading to a larger resulting array than the original.

- [Syntax](#syntax)
- [Examples](#examples)
- [Mapping returns unique values](#mapping-returns-unique-values)
- [Concatenating arrays with overall result](#concatenating-arrays-with-overall-result)
- [Ignoring `undefined` values](#ignoring-undefined-values)
- [Workaround to keep the same number of elements as in input array](#workaround-to-keep-the-same-number-of-elements-as-in-input-array)
- [`.()` vs. `map()`](#-vs-map)

## Syntax

```jora
.(expr)
```

Using `map()` method:

```jora
.map(fn) // or .map(=> expr)
```

## Examples

Pick property values:

```jora
$input: [
    { "baz": 1 },
    { "baz": 2 },
    { "baz": 3 }
];

$input.(baz) // Result: [ 1, 2, 3 ]
// Alternatives:
//
//   $input.map(=> baz)
//
// or simply
//
//   $input.baz
//
```

Rename property:

```jora
$input: [
    { "a": 1 },
    { "a": 2 },
    { "a": 3 }
];

$input.({ answer: a })
// Result:
// [
//     { "answer": 1 },
//     { "answer": 2 },
//     { "answer": 3 }
// ]
```

Pick object properties:

```jora
$input: [
    { "foo": "bar", "baz": 1 },
    { "foo": "bar", "baz": 2 },
    { "foo": "bar", "baz": 3 }
];

$input.({ baz })
// Result:
// [
//     { "baz": 1 },
//     { "baz": 2 },
//     { "baz": 3 }
// ]
```

The mapping can be applied to a primitive value (numbers, strings, etc.):

```jora
123.({ foo: $ })
// Result: { "foo": 123 }
```

> **Note:** In the above example, `$` references the current value.

Copying over the object with spread and computing additional properties:

```jora
{ "foo": 41 }.({ ..., answer: foo + 1 })
// Result: { "foo": 41, "answer": 42 }
```

or

```jora
{ "foo": 41 }.map(=> { ..., answer: foo + 1 })
// Result: { "foo": 41, "answer": 42 }
```

## Mapping returns unique values

When using the mapping in Jora, it automatically returns unique values in the resulting array, which can lead to a smaller output array than the input array.

```jora
[ 1, 2, 2, 3, 3, 3 ].() // .() is equivalent to .($)
// Result: [1, 2, 3]
```

## Concatenating arrays with overall result

If an expression of mapping returns an array, the resulting array will be concatenated with the overall result with dropping of duplicate values. This may lead to a larger output array than the input array.

`Input`

```jora
$input: [
    { "values": [1, 2, 3] },
    { "values": [3, 4] }
];

$input.(values) // Result: [ 1, 2, 3, 4 ]
```

## Ignoring `undefined` values

The mapping in Jora automatically ignores `undefined` values when processing arrays. This feature can be useful when you want to filter out `undefined` values from the result while mapping an array of objects where some objects do not have a specified property.

In a simple array:

```jora
[ 1, undefined, 3 ].($)
// Result: [ 1, 3 ]
```

In an array of objects:

```jora
[ { "a": 1 }, { }, { "a": 3 } ].(a)
// Result: [ 1, 3 ]
```

In an array of nested objects:

```jora
$input: [
    { "a": { "nested": 1 } },
    { },
    { "a": 3 }
];

$input.(a.nested)
// Result: [ 1 ]
```

In the above examples, we can see how Jora's map method handles `undefined` values, effectively filtering them out of the output while preserving the values that are not `undefined`.

## Workaround to keep the same number of elements as in input array

In some cases, you might want to preserve the same number of elements in the output array as in the input array. You can use a simple workaround by wrapping the result of the map method into an object. Let's consider an example:

```jora
[ 1, 2, 2, 3, 3, 3 ].({ value })
// Result:
// [
//   { "value": 1 },
//   { "value": 2 },
//   { "value": 2 },
//   { "value": 3 },
//   { "value": 3 },
//   { "value": 3 }
// ]
```

In this example, we wrap the result of the map method into an object with a `value` property, which results in an output array with the same number of elements as the input array.

## `.()` vs. `map()`

In general, `.(...)` is the preferred syntax because it is more concise. However, the `map()` method exists to allow mapping with a given function, for instance via a context (`#`) or defined in the query.

```jora
$myMapper: => { value: $ * 2 };
[1, 2, 3].map($myMapper) // Result: [2, 4, 6]
```

In this case, the choice between `.(...)` and `map()` depends on the specific use case and the desired level of readability and flexibility. Both syntaxes can be used interchangeably for mapping purposes, equivalence of syntaxes:

- `.map(fn)` is equivalent to `.(fn())`
- `.(expr)` is equivalent to `.map(=> expr)`
