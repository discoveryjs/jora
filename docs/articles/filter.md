# Filtering: `.[…]` and `filter()` method

In Jora, filtering allows to extract specific elements from an array based on a condition. This is achieved using the `.[…]` syntax or `filter()` method. Filtering returns an element in the result if the condition inside the filter evaluates to a truthy value. If the condition evaluates to a falsy value, the element will be excluded from the result.

> Note: In Jora, empty arrays and objects with no entries are considered falsy.

- [Syntax](#syntax)
- [Examples](#examples)
- [`.[]` vs. `filter()`](#-vs-filter)

## Syntax

```jora
.[block]
```

Using `filter()` method:

```jora
.filter(fn) // or .filter(=> expr)
```

## Examples

Filtering an array of numbers:

```jora
[1, 2, 3, 4, 5].[$ >= 3]
// Result: [3, 4, 5]
```

An alternative:

```jora
[1, 2, 3, 4, 5].filter(=> $ >= 3)
// Result: [3, 4, 5]
```

Filtering an array of objects:

```jora
$input: [
  { "title": "Book 1", "price": 5 },
  { "title": "Book 2", "price": 15 },
  { "title": "Book 3", "price": 7 },
  { "title": "Book 4", "price": 12 }
];

$input.[price <= 10]
// Result:
// [
//   { "title": "Book 1", "price": 5 },
//   { "title": "Book 3", "price": 7 }
// ]
```

Filtering an array of objects using a nested property:

```jora
$input: [
  { "id": 1, "data": { "value": 42 } },
  { "id": 2, "data": { "value": 17 } },
  { "id": 3, "data": { "value": 99 } }
];

$input.[data.value > 20]
// Result:
// [
//   { "id": 1, "data": { "value": 42 } },
//   { "id": 3, "data": { "value": 99 } }
// ]
```

## `.[]` vs. `filter()`

In general, `.[…]` is the preferred syntax because it is more concise. However, the `filter()` method exists to allow filtering with a given function, for instance via a context (`#`) or defined in the query.

```jora
$myFilter: => data.value > 20;
.filter($myFilter)
```

In this case, the choice between `.[…]` and `filter()` depends on the specific use case and the desired level of readability and flexibility. Both syntaxes can be used interchangeably for filtering purposes, equivalence of syntaxes:

- `.filter(fn)` is equivalent to `.[fn()]`
- `.[expr]` is equivalent to `.filter(=> expr)`
