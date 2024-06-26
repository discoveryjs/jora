# Slice Notation in Jora

Slice notation is a convenient way to extract a portion of a sequence, such as an array or a string, in Jora. It allows you to define the start, end, and step of the slice. Slice notation is a complement to the `slice()` method, which is more verbose but works the same way. This notation is based on the [slice notation proposal for ECMAScript](https://github.com/tc39/proposal-slice-notation).

- [Syntax](#syntax)
- [Examples](#examples)
    - [Arrays](#arrays)
    - [Strings](#strings)
    - [Negative Step](#negative-step)
- [The algorithm](#the-algorithm)

## Syntax

The slice notation syntax is as follows:

```
sequence[from:to:step]
```

- `from` (optional) – the starting index of the slice (inclusive). Default value is 0.
- `to` (optional) – the ending index of the slice (exclusive). Default value is the length of the sequence.
- `step` (optional) – the increment between elements in the slice. Default value is 1.

All values in the slice notation can be either positive or negative integers. Negative integers for `from` and `to` are interpreted as counting from the end of the sequence. Negative value for `step` reverses the order of the elements stepping from `to` to `from`.

> Although all values are optional, it's essential to use at least one colon. Otherwise, if an expression is empty, it will be treated as bracket notation. In other words, `$[:]` denotes slice notation, while `$[]` indicates [bracket notation](./bracket-notation.md).

## Examples

### Arrays

```jora
[1, 2, 3, 4, 5][1:4]
// Result: [2, 3, 4]
```
```jora
[1, 2, 3, 4, 5][:3]
// Result: [1, 2, 3]
```
```jora
[1, 2, 3, 4, 5][-2:]
// Result: [4, 5]
```
```jora
[1, 2, 3, 4, 5][::2]
// Result: [1, 3, 5]
```
```jora
[1, 2, 3, 4, 5][4:1] // the same as [1:4:-1] (see "Negative Step" below)
// Result: [4, 3, 2]
```

Omitting all lower bound and upper bound value, produces a new copy of the array:

> Note that a colon is essential here. Otherwise, it will be treated as [bracket notation](./bracket-notation.md)

```jora
['a', 'b', 'c', 'd'][:] // an alternative is to use [...array]
// Result: ['a', 'b', 'c', 'd']
```
```jora
$value: ['a', 'b', 'c', 'd'];
$value[:] = $value
// Result: false
```

### Strings

```jora
"hello"[1:4]
// Result: "ell"
```
```jora
"hello"[:3]
// Result: "hel"
```
```jora
"hello"[-2:]
// Result: "lo"
```
```jora
"hello"[::2]
// Result: "hlo"
```
```jora
"hello"[4:1] // the same as [1:4:-1] (see "Negative Step" below)
// Result: "lle"
```

### Negative Step

A negative step can be used to reverse the order of the elements in the slice:

```jora
[1, 2, 3, 4, 5][1:4:-1] // the same as [4:1]
// Result: [4, 3, 2]
```
```jora
[1, 2, 3, 4, 5, 6, 7, 8][6:1:-2] // the same as [1:6:2]
// Result: [2, 4, 6]
```
```jora
"hello"[1:4:-1]
// Result: "lle"
```

## The algorithm

- Input validation: Check if the input sequence is an array or a string. If the input is neither an array nor a string, return an empty array.
- Parse parameters: Parse the `from`, `to`, and `step` parameters as integers, setting their default values if not provided:
    - `from` (default: `0`) – the starting index of the slice (inclusive)
    - `to` (default: length of the sequence) – the ending index of the slice (exclusive)
    - `step` (default: `1`) – the increment between elements in the slice
- Handle negative indices: If `from` or `to` are negative, calculate their positive counterparts by adding the length of the sequence to them.
- Bound checking: Ensure that `from` and `to` indices are within the valid bounds of the sequence. If the indices are out of bounds, adjust them to the nearest valid index in range [0 .. {length of the sequence}].
- Inverse direction if needed: If from is greater than to, swap the from and to values and negate the sign of step
- Create a new sequence: Based on the input type (array or string), create a new empty sequence of the same type.
- Iterate and populate the new sequence: Loop through the input sequence using the `from`, `to`, and `step` parameters, adding elements to the new sequence as follows:
    - If `step` is positive, start at the `from` index and move forward, stopping before the `to` index.
    - If `step` is negative, start at the `to - 1` index and move backward, stopping when index equals to `from`.
- Return the new sequence: Return the newly created sequence, which contains the selected elements from the input sequence according to the specified slice notation.

This algorithm ensures that the original sequence remains unmodified, and the output is a new sequence containing the desired elements based on the provided slice notation parameters.
