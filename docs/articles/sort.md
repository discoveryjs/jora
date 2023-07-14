# Sorting: `sort()` method

Jora provides a powerful and flexible syntax for sorting data. The language allows you to define comparator functions using a concise syntax that specifies the sorting order (`asc` for ascending, `desc` for descending) and the properties to be sorted.

- [Sorting function definition syntax](#sorting-function-definition-syntax)
- [Sorting function modifiers](#sorting-function-modifiers)
- [Examples](#examples)
- [Comparison with JavaScript sorting](#comparison-with-javascript-sorting)

## Sorting function definition syntax

In Jora, a sorting function (comparator function) can be defined in several ways. These functions take two arguments and compare the query result for each in the specified order (`asc` or `desc`). Here are some examples:

```jora
expr asc  // JS equivalent: (a, b) => expr(a) > expr(b) ? 1 : expr(a) < expr(b) ? -1 : 0
```

```jora
expr desc // JS equivalent: (a, b) => expr(a) < expr(b) ? 1 : expr(a) > expr(b) ? -1 : 0
```

A comma-separated sequence defines a single function:

```jora
foo asc, bar desc // JS equivalent: (a, b) =>
                  //       a.foo > b.foo ? 1 : a.foo < b.foo ? -1 :
                  //       a.bar < b.bar ? 1 : a.bar > b.bar ? -1 :
                  //       0
```

## Sorting of mixed type value arrays

Before comparing a pair of values, a comparator function compares their types. When types are different, a comparator returns a result of types comparison, since comparing let say a number and an object makes no sense. In other words, an object value is always bigger than a number, and a boolean is always lower than a string:

1. boolean
2. NaN
3. number
4. string
5. null
6. object
7. other
8. undefined
## Sorting function modifiers

There are some modifiers for `asc` and `desc` that provide additional sorting options:

- `ascN` / `descN`: Natural sorting (using [@discoveryjs/natural-compare](https://github.com/discoveryjs/natural-compare))
- `ascA` / `descA`: The same as `asc` / `desc`, but reverse order for numbers
- `ascAN` / `descAN`: The same as `asc` / `desc`, but using natural compare and reverse order for numbers

## Examples

Suppose we have an array of objects representing products:

```jora
$products: [
    { name: "Laptop", price: 1000 },
    { name: "Smartphone", price: 800 },
    { name: "Tablet", price: 600 }
];
```

We can sort the products by price in ascending order:

```jora
$products.sort(price asc)
```

Or in descending order:

```jora
$products.sort(price desc)
```

We can also sort by multiple properties. For example, suppose we have an array of objects representing users with a `name` and `age` property:

```json
[
    { "name": "Alice", "age": 30 },
    { "name": "Bob", "age": 25 },
    { "name": "Charlie", "age": 30 }
]
```

We can sort the users first by age in ascending order and then by name in descending order:

```jora
sort(age asc, name desc)

// Input[1]
// Result: [
//     { "name": "Bob", "age": 25 },
//     { "name": "Charlie", "age": 30 },
//     { "name": "Alice", "age": 30 }
// ]
```

## Comparison with JavaScript sorting

Unlike JavaScript, Jora's `sort()` method does not modify the input array. Instead, it creates a new array with the ordered elements. Regular functions can also be used with the `sort()` method. Such functions should return a value that will be used for comparison, e.g. `sort(=> name)`. Jora will use this function in the following way: `fn(a) > fn(b) ? 1 : fn(a) < fn(b) ? -1 : 0`. If a function in the `sort()` method returns an array, Jora compares array lengths first (in ascending order), then compares elements one by one (if lengths of arrays are equal). For example, `sort(=> [name, age])` is equivalent to `name asc, age asc`.

Using functions instead of `expr asc` or `expr desc` is less powerful since you cannot specify the direction of sorting or other modifications like natural sorting. Sorting is always in ascending order. However, you can use the `reverse()` method afterward to achieve descending order, though it's less performant and produces two new arrays instead of one.

Sorting functions created with `asc` / `desc` keywords can be stored in a variable for further usage, e.g., `$orderByName: name asc; $orderByAgeAndName: age desc, name asc;`.
