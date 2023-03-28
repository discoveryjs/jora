# Filtering: `.[...]` and `filter()` method

In Jora, filtering data is a fundamental operation that allows you to extract specific elements from an array based on a condition. This is achieved using the `.[...]` syntax and `filter()` method. Both of these methods work on arrays and provide the same filtering functionality, but with slightly different syntax.

Filtering returns an element in the result if the condition inside the filter evaluates to a truthy value. If the condition evaluates to a falsy value, the element will be excluded from the result.

## Syntax

```
.filter(fn) // or .filter(=> expr)
.[block]
```

## Examples

- [Filtering an array of numbers](#filtering-an-array-of-numbers)
- [Filtering an array of objects](#filtering-an-array-of-objects)
- [Filtering an array of objects using a nested property](#filtering-an-array-of-objects-using-a-nested-property)
- [`.[...]` vs. `filter()` method](#-vs-filter-method)

### Filtering an array of numbers

Suppose we want to filter out all numbers less than 3 from an array of integers.

`Input`

```json
[1, 2, 3, 4, 5]
```

`Query`

```jora
.[$ >= 3]
```

or

```jora
.filter(=> $ >= 3)
```

`Output`

```json
[3, 4, 5]
```

### Filtering an array of objects

Let's say we have an array of objects representing books, and we want to filter out all books with a price greater than 10.

`Input`

```json
[
  { "title": "Book 1", "price": 5 },
  { "title": "Book 2", "price": 15 },
  { "title": "Book 3", "price": 7 },
  { "title": "Book 4", "price": 12 }
]
```

`Query`

```jora
.[price <= 10]
```

or

```jora
.filter(=> price <= 10)
```

`Output`

```json
[
  { "title": "Book 1", "price": 5 },
  { "title": "Book 3", "price": 7 }
]
```

### Filtering an array of objects using a nested property

Consider an array of objects with nested properties, and we want to filter out all objects with a nested property value less than a specified threshold.

`Input`

```json
[
  { "id": 1, "data": { "value": 42 } },
  { "id": 2, "data": { "value": 17 } },
  { "id": 3, "data": { "value": 99 } }
]
```

`Query`

```jora
.[data.value > 20]
```

or

```jora
.filter(=> data.value > 20)
```

`Output`

```json
[
  { "id": 1, "data": { "value": 42 } },
  { "id": 3, "data": { "value": 99 } }
]
```

### `.[...]` vs. `filter()` method

In general, `.[...]` is the preferred syntax because it is more concise. However, the `filter()` method exists to allow filtering with a given function, for instance via a context (`#`) or defined in the query.

```jora
$myFilter: => data.value > 20;
.filter($myFilter)
```

In this case, the choice between `.[...]` and `filter()` depends on the specific use case and the desired level of readability and flexibility.
