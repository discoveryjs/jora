# Built-in methods



## bool()

Similar to `Boolean()` in JavaScript, but treats *empty arrays* and *objects with no keys* as falsy

```jora
123.bool()  // Result: true
```

```jora
"".bool()   // Result: false
```

```jora
[].bool()   // Result: false
```

```jora
[false].bool() // Result: true
```

```jora
{}.bool()   // Result: false
```

```jora
{ a: 42 }.bool() // Result: true
```

## entries()

Similar to `Object.entries()` in JavaScript, using `{ key, value }` objects for entries instead of array tuples.

```jora
{ a: 42, b: 123 }.entries() // Result: [{ key: 'a', value: 42 }, { key: 'b', value: 123 }]
```

```jora
[1, 2].entries() // Result: [{ key: '0', value: 1 }, { key: '1', value: 2 }]
```

```jora
'abc'.entries() // Result: [{ key: '0', value: 'a' }, { key: '1', value: 'b' }, { key: '2', value: 'c' }]
```

```jora
123.entries() // Result: []
```

## filter(fn)

The same as `Array#filter()` in JavaScript, `filter(fn)` is equivalent to `.[fn()]` (see [Filtering](./filter.md)).

## fromEntries()

Similar to `Object.fromEntries()` in JavaScript, expects array `{ key, value }` objects as entries instead of array tuples.

```jora
[{ key: 'a', value: 42 }, { key: 'b', value: 123 }].fromEntries()
// Result: { a: 42, b: 123 }
```

## group(fn, fn)

Group array items by a value fetched with the first getter and return an array of `{ key, value }` entries  (see [Grouping](./group.md)).

## join(separator)

The same as `Array#join()` in JavaScript. When `separator` is not specified, `,` is used.

## keys()

The same as `Object.keys()` in JavaScript.

## map(fn)

The same as `Array#map()` in JavaScript, is equivalent to `.(fn())` (see [Mapping](./map.md)).

## match(pattern, matchAll)

Similar to `String#match()`. `pattern` might be a RegExp or string. When `matchAll` is truthy, returns an array of all occurrences of the `pattern`. Expressions `match(/../g)` and `match(/../, true)` are equivalent.

## max(compare)

Return max value from an array of string, excluding `undefined`. The method returns `undefined` when there are no values (i.e. an empty array) or a comparator returns `0` for all values when compared with `undefined`. For string values a natural comparison is used by default.

The logic of `max()` method equivalent (but more performant and memory efficient) to the following expression:
- no comparator: `sort().[$ != undefined][-1]`
- with comparator: `sort(compare).[compare(undefined) != 0][-1]`

```jora
[1, 4, 2, 3].max()  // Result: 4
```

```jora
$input: [{ a: 10 }, { a: 42 }, {}, { a: 42, ok: 1 }, { a: 20 }];

$input.max(=> a)  // Result: { a: 42, ok: 1 }
```

```jora
$input: [{ a: 10 }, { a: 42 }, {}, { a: 20 }];

$input.max(a desc)  // Result: { a: 10 }
```

```jora
'hello world'.max() // Result: 'w'
```

## min(compare)

Return min value from an array of string. The method returns `undefined` when there are no values (i.e. an empty array) or a comparator returns `0` for all values when compared with `undefined`. For string values a natural comparison is used by default.

The logic of `min()` method equivalent to expression `sort()[0]` or `sort(fn)[0]`, but more performant and memory efficient.

```jora
[4, 1, 2, 3].min()  // Result: 1
```

```jora
$input: [{ a: 10 }, { a: 5, ok: 1 }, {}, { a: 5 }, { a: 20 }];

$input.min(=> a)  // Result: { a: 5, ok: 1 }
```

```jora
$input: [{ a: 10 }, { a: 42 }, {}, { a: 20 }];

$input.min(a desc)  // Result: { a: 42 }
```

```jora
'hello world'.min() // Result: ' '
```

## pick()

Get a value by a key, index, or function. Supports negative indices for arrays and strings.

## reduce(fn, initValue)

The same as `Array#reduce()` in JS. Use `$$` to access the accumulator and `$` for the current value, e.g., find the max value:

```jora
[1, 5, 2, 3, 4].reduce(=>$ > $$ ? $ : $$)
// Result: 5
```

## replace(pattern, replacement)

The same as `String#replaceAll()` in JavaScript, but also works for arrays. When `pattern` is RegExp, a `g` flags adds automatically if omitted.

## reverse()

Reverse order of elements in an array.

## size()

Returns count of entries in an object, otherwise returns `length` property value or `0` when the field is absent.

```jora
{ a: 42, b: 123 }.size()  // Result: 2
```

```jora
[1, 2, 3, 4].size()  // Result: 4
```

```jora
"Hello world".size()  // Result: 11
```

```jora
123.size()  // Result: 0
```

## slice(from, to)

The same as `Array#slice()` and `String#slice()` in JavaScript (see also [Slice notation](./slice-notation.md)).

## sort(compare)

Sort an array by a value fetched with getter (`fn`). Can use sorting function definition syntax with `asc` and `desc` (see [Sorting](./sort.md))

## split(pattern)

The same as `String#split()` in JavaScript. `pattern` may be a string or regex.

## sum(getter)

Computes the sum of the values in an array. It returns `undefined` for non-array values and empty arrays. The method ignores `undefined` values returned by the getter function (default getter function is `=> $`, which returns the value itself), all other values are converted to a number and used in the summation, including `NaN` and ±`Infinity`. The method employs the [Kahan–Babuška summation algorithm](https://en.wikipedia.org/wiki/Kahan_summation_algorithm) to minimize numerical errors in the result.

```jora
[].sum()
// Result: undefined
```
```jora
[1, 2, 3, 4].sum()
// Result: 10
```
```jora
[1, 2, undefined, null, '3', 4].sum()
// Result: 10
```
```jora
[1, 2, NaN, 4].sum()
// Result: NaN
```
```jora
[0.1, 0.2, 0.3].sum()
// Result: 0.6
```

> Note: The `sum()` method returns `0.6` instead of `0.6000000000000001`, which is the result of the expression `0.1 + 0.2 + 0.3`. This is because the Kahan–Babuška summation algorithm is used to reduce numerical error.

Using a custom getter function:

```jora
[1, 2, 3, 4].sum(=> $ * $) // Sum of number squares
// Result: 30
```
```jora
[{ age: 10 }, {}, { age: 20 }, null, { age: 10 }].sum(=> age)
// Result: 40
```

> Note: When summing values in an array of objects, it is recommended to use a custom getter with the `sum()` method rather than using dot notation or mapping prior to summation. This is because dot notation and mapping are ignores duplicate values. For example, the query `[…].age.sum()` might return 30 instead of the expected 40, which would be correctly returned by the query `[…].sum(=> age)`.

Arrays are always converting to `NaN`. To summing array of arrays, a summation of sums should be used:

```jora
[[1, 2], [], [4]].sum()
// Result: NaN
```
```jora
[[1, 2], [], null, [4], undefined].sum(=> sum())
// Result: 7
```

## toLowerCase(locales)

The same as `String#toLocaleLowerCase()` in JavaScript.

## toUpperCase(locales)

The same as `String#toLocaleUpperCase()` in JavaScript.

## trim()

The same as `String#trim()` in JavaScript.

## values()

The same as `Object.values()` in JavaScript.

## Math methods

JavaScript's [`Math`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math) methods.

> Note: Keep in mind that the unary `-` operator has lower precedence than other operators. To apply a method to a negative scalar number, use the [grouping operator](./operators.md#grouping-operator), the [pipeline operator](./operators.md#pipeline-operator), or store the number in a [variable](./variables.md) and then apply the method to it. For example, instead of `-123.abs()`, which is interpreted as `-(123.abs())`, you should use one of the following:
> - `(-123).abs()`
> - `-123 | abs()`
> - `$num = -123; $num.abs()`

### abs()

Returns the absolute value of a number.

```jora
-123 | abs()
// Result: 123
```
```jora
'hello world'.abs()
// Result: NaN
```

### acos()

Returns the arccosine of a number.

```jora
(-1).acos()
// Result: 3.141592653589793
```
```jora
1.acos()
// Result: 0
```
```jora
'hello world'.acos()
// Result: NaN
```

### acosh()

Returns the hyperbolic arccosine of a number.

### asin()

Returns the arcsine of a number.

### asinh()

Returns the hyperbolic arcsine of a number.

### atan()

Returns the arctangent of a number.

### atan2()

Returns the arctangent of the quotient of its arguments, i.e. the angle in the plane (in radians) between the positive x-axis and the ray from `(0, 0)` to the point `(x, y)`, for `y.atan2(x)`.

### atanh()

Returns the hyperbolic arctangent of a number.

### cbrt()

Returns the cube root of a number.

```jora
64.cbrt()
// Result: 4
```

### ceil()

Returns the smallest integer greater than or equal to a number.

```jora
3.123.ceil()
// Result: 4
```

### clz32()

Returns the number of leading zero bits of the 32-bit integer of a number.

### cos()

Returns the cosine of a number.

### cosh()

Returns the hyperbolic cosine of a number.

### exp()

Returns <code>e<sup>x</sup></code>, where `x` is the argument, and `e` is Euler's number (2.718…, the base of the natural logarithm).

```jora
2.exp()
// Result: 7.38905609893065
```
```jora
(-1).exp()
// Result: 0.36787944117144233
```

### expm1()

Returns subtracting `1` from `exp(x)`, i.e. <code>e<sup>x</sup> - 1</code>.

```jora
2.exp()
// Result: 6.38905609893065
```
```jora
(-1).exp()
// Result: -0.6321205588285577
```

### floor()

Returns the largest integer less than or equal to a number.

```jora
3.123.floor()
// Result: 3
```

### fround()

Returns the nearest [32-bit single precision](https://en.wikipedia.org/wiki/Single-precision_floating-point_format) float representation of a number.

```jora
5.5.fround()
// Result: 5.5
```
```jora
5.05.fround()
// Result: 5.050000190734863
```

### hypot()

Returns the square root of the sum of squares of its arguments.

> FIXME: Must take an array of numbers like `sum()`

```jora
[3].hypot(4, 5)
// Result: 7.0710678118654755
```

### imul()

Returns the result of the C-like 32-bit integer multiplication of the two parameters.

```jora
3.imul(4)
// Result: 12
```
```jora
0xffffffff.imul(5)
// Result: -5
```

### log()

Returns the natural logarithm (<code>log<sub>e</sub></code> or `ln`) of a number.

```jora
// 2^3 = 8
8.log() / 2.log()
// Result: 3
```

### log10()

Returns the base-10 logarithm of a number, i.e. <code>log<sub>10</sub>(x)</code>.

```jora
2.log10()
// Result: 0.3010299956639812
```

### log1p()

Returns the natural logarithm (<code>log<sub>e</sub></code> or `ln`) of `1 + x` for the number `x`.

```jora
1.log1p()
// Result: 0.6931471805599453
```

### log2()

Returns the base-2 logarithm of a number, i.e. <code>log<sub>2</sub>(x)</code>.

```jora
2.log2()
// Result: 1
```

### pow()

Returns base `x` to the exponent power `y`, i.e. <code>x<sup>y</sup></code>

```jora
2.pow(3)
// Result: 8
```
```jora
25.pow(0.5)
// Result: 5
```

### round()

Returns the value of a number rounded to the nearest integer.

```jora
5.2.round()
// Result: 5
```
```jora
5.5.round()
// Result: 6
```
```jora
5.9.round()
// Result: 6
```

### sign()

Returns `1` or `-1`, indicating the sign of the number passed as argument. If the input is `0` or `-0`, it will be returned as-is.

```jora
5.sign()
// Result: 1
```
```jora
-42 | sign()
// Result: -1
```
```jora
0.sign()
// Result: 0
```

### sin()

Returns the sine of a number.

### sinh()

Returns the hyperbolic sine of a number.

### sqrt()

Returns the positive square root of a number.

```jora
25.sqrt()
// Result: 5
```

### tan()

Returns the tangent of a number.

### tanh()

Returns the hyperbolic tangent of a number.

### trunc()

Returns the integer part of a number by removing any fractional digits. It truncates (cuts off) the dot and the digits to the right of it, no matter whether the argument is a positive or negative number.

```jora
42.84.trunc()
// Result: 42
```
```jora
-123.9 | trunc()
// Result: -123
```
