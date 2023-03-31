# Array literals

Array literals in Jora are similar to those in JavaScript. They allow you to create an array by enclosing a comma-separated list of values or expressions within square brackets `[]`. Jora supports a wide range of values, including numbers, strings, objects, other arrays, and even Jora expressions.

## Syntax

```jora
[1, 2, 3, 4, 5]
```

- [Nested arrays](#nested-arrays)
- [Computed values](#computed-values)
- [Array slicing](#array-slicing)
- [Concatenating arrays](#concatenating-arrays)
- [Spread operator](#spread-operator)
- [Special behavior with operators `+` and `-`](#special-behavior-with-operators--and--)

## Nested arrays

You can nest arrays within other arrays to create multidimensional arrays. For example:

```jora
[
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
]
```

This creates a 3x3 matrix represented as a 2-dimensional array.

## Computed values

Jora allows you to use expressions and variables within array literals to compute values dynamically. Here's an example that calculates squares of numbers from 1 to 5:

```jora
$n: 5;
[1..$n].($ * $)
```

The result is an array `[1, 4, 9, 16, 25]`.

## Array slicing

Jora provides the `slice()` method and slice notation to extract a portion of an array:

```jora
$numbers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
$numbers.slice(3, 7) // Result: [3, 4, 5, 6]
```

Or using slice notation:

```jora
$numbers[3:7]
```

Both examples return a new array containing elements at indices 3, 4, 5, and 6.

## Concatenating arrays

Jora supports array concatenation using the spread operator `...` and the `+` operator. Here's an example that concatenates two arrays:

```jora
$first: [1, 2, 3];
$second: [4, 5, 6];

[...$first, ...$second] // Result: [1, 2, 3, 4, 5, 6]
// Or: $first + $second
```

## Spread operator

The spread operator `...` can be used in an array literal to include all elements of an existing array:

```jora
$first: [1, 2, 3];
$second: [4, 5, 6];

[...$first, ...$second] // Result: [1, 2, 3, 4, 5, 6]
```

In this example, the spread operator is used to merge `$first` and `$second` arrays into a new array containing all elements from both arrays.

```jora
$input: [1, 2, 3, 4, 5, 6, 7, 8, 9];
$input.reduce(=>$ % 2 ? [...$$, $] : $$, []) // Result: [1, 3, 5, 7, 9]
```

In this example, the `reduce()` method iterates over the `$input` array and checks if the current value (`$`) is odd (i.e., `$ % 2`). If the value is odd, it appends the value to the accumulator array (`...$$, $`); otherwise, it leaves the accumulator unchanged (`$$`). The initial value of the accumulator is an empty array `[]`.

Unlike JavaScript, spread operator in Jora inlines arrays only and left any other values "as is":

```jora
[...[1, 2], ...3, ..."45", ...{ "6": 7 }] // -> [1, 2, 3, "45", { "6": 7 }]
```

## Special behavior with operators `+` and `-`

As demonstrated above, the `+` operator can concatenate arrays and values. For example:

```jora
[1, 2, 3] + 4 + [5, 6] // Result: [1, 2, 3, 4, 5, 6]
```

The `-` operator, when the left operand is an array, produces a new array with the right operand value filtered out:

```jora
[1, 2, 3, 4, 5] - 3 - [1, 5] // Result: [2, 4]
```

This results in an array `[2, 4]`, with 1, 3, and 5 removed.
