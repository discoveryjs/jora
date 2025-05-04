# Built-in methods

## avg(<!--getter-->)

The `avg(getter)` method calculates the [arithmetic mean](https://en.wikipedia.org/wiki/Arithmetic_mean), also known as the average, of a collection of numbers. The arithmetic mean is computed by adding all the numbers in the collection and then dividing by the total count of numbers. This method is equivalent to the expressions `numbers() | sum() / size()` or `sum() / count()`.

```jora
[1, 2, 3, 4].avg()
// Result: 2.5
```
```jora
[{}, { a: 2 }, undefined, { a: 4 }].avg(=> a)
// Result: 3
```

## bool()

Similar to `Boolean()` in JavaScript, but treats *empty arrays* and *objects with no keys* as falsy.

```jora
123.bool()
// Result: true
```
```jora
"".bool()
// Result: false
```
```jora
[].bool()
// Result: false
```
```jora
[false].bool()
// Result: true
```
```jora
{}.bool()
// Result: false
```
```jora
{ a: 42 }.bool()
// Result: true
```

## count(<!--getter-->)

The `count()` method calculates the number of non-undefined values present in the input array. It processes each value in the array through a `getter` function (default function is `=> $`). If the processed value is not `undefined`, it increments the count by 1. If the input is not an array, the method returns `0`. This method is functionally equivalent to the expression `numbers().size()`.

```jora
[1, 2, 3].count()
// Result: 3
```
```jora
[1, NaN, false, true, '123', { foo: 1 }, [5]].count()
// Result: 7
```
```jora
[{ age: 10 }, { age: 20 }, {}, { foo: 1 }].count(=> age)
// Result: 2
```

While the primary function of this method is to count non-undefined values in the input, it can also be utilized to count values that meet a specific condition, by converting falsy values to `undefined`:

```jora
[{ a: 1, b: 3}, { a: 5, b: 4 }, { a: 3, b: 8 }].count(=> a < b or undefined)
// Result: 2
```

In the last example, the `count()` method returns the count of objects where the value of `a` is less than `b`.

## entries()

Similar to `Object.entries()` in JavaScript, using `{ key, value }` objects for entries instead of array tuples.

```jora
{ a: 42, b: 123 }.entries()
// Result: [{ key: 'a', value: 42 }, { key: 'b', value: 123 }]
```
```jora
[1, 2].entries()
// Result: [{ key: '0', value: 1 }, { key: '1', value: 2 }]
```
```jora
'abc'.entries()
// Result: [{ key: '0', value: 'a' }, { key: '1', value: 'b' }, { key: '2', value: 'c' }]
```
```jora
123.entries()
// Result: []
```

## filter(<!--fn-->)

The same as `Array#filter()` in JavaScript, `filter(fn)` is equivalent to `.[fn()]` (see [Filtering](./filter.md)).

```jora
[1, 2, 3, 4].filter(=> $ % 2)
// Result: [1, 3]
```
```jora
$isOdd: => $ % 2;
[1, 2, 3, 4].filter($isOdd)
// Result: [1, 3]
```

## fromEntries()

Similar to `Object.fromEntries()` in JavaScript, expects array `{ key, value }` objects as entries instead of array tuples.

```jora
[{ key: 'a', value: 42 }, { key: 'b', value: 123 }].fromEntries()
// Result: { a: 42, b: 123 }
```

## group(<!--fn, fn-->)

Group array items by a value fetched with the first getter and return an array of `{ key, value }` entries (see [Grouping](./group.md)).

## indexOf(<!--value, fromIndex-->)

Returns the first index of the specified value, starting the search at `fromIndex`. If `fromIndex` is not provided or cannot be converted to a number, the search starts from index `0`. The method returns `-1` if the value is not found or if the input doesn't implement the `indexOf()` method. Unlike JavaScript, this method supports index searching for `NaN` values.

```jora
[1, 2, 3, 1, 2, 3].indexOf(2)
// Result: 1
```
```jora
[1, 2, 3, 1, 2, 3].indexOf(2, 3)
// Result: 4
```
```jora
'abc abc'.indexOf('bc')
// Result: 1
```
```jora
[1, NaN, 2, NaN, 3].indexOf(NaN)
// Result: 1
```

## join(<!--separator-->)

The same as `Array#join()` in JavaScript. When `separator` is not specified, `","` is used.

```jora
[1, 2, 3].join()
// Result: "1,2,3"
```
```jora
[undefined, null, 123, NaN, "str", [2, 3], {}].join(' / ')
// Result: " /  / 123 / NaN / str / 2,3 / [object Object]"
```

## keys()

The same as `Object.keys()` in JavaScript.

```jora
{ foo: 1, bar: 2 }.keys()
// Result: ["foo", "bar"]
```
```jora
[2, 3, 4].keys()
// Result: ["0", "1", "2"]
```
```jora
123.keys()
// Result: []
```

## lastIndexOf(<!--value, fromIndex-->)

Returns the first index of the specified value starting from the end at `fromIndex`. If `fromIndex` is not specified or cannot be converted to a number, it defaults to array or string length. The method returns `-1` if the value is not found or if the input doesn't implement the `lastIndexOf()` method. Unlike JavaScript, this method supports index searching for `NaN` values.

```jora
[1, 2, 3, 1, 2, 3].lastIndexOf(2)
// Result: 4
```
```jora
[1, 2, 3, 1, 2, 3].lastIndexOf(2, 3)
// Result: 1
```
```jora
'abc abc'.lastIndexOf('bc')
// Result: 5
```
```jora
[1, NaN, 2, NaN, 3].lastIndexOf(NaN)
// Result: 3
```

## map(<!--fn-->)

The same as `Array#map()` in JavaScript, is equivalent to `.(fn())` (see [Mapping](./map.md)).

```jora
[1, 2, 3, 4].map(=> $ * 2)
// Result: [2, 4, 6, 8]
```
```jora
$getA: => a;
[{ a: 1 }, { a: 2 }, { a: 1 }].map($getA)
// Result: [1, 2]
```

## match(<!--pattern, matchAll-->)

Similar to `String#match()`. `pattern` might be a RegExp or string. When `matchAll` is truthy, returns an array of all occurrences of the `pattern`. Expressions `match(/…/g)` and `match(/…/, true)` are equivalent.

```jora
'abcabc'.match('bc')
// Result: {
//     matched: ['bc'],
//     start: 1,
//     end: 3,
//     input: 'abcabc',
//     groups: null,
// }
```
```jora
'abcabc'.match('bc', true) // matchAll parameter is true
// Result: [{
//     matched: ['bc'],
//     start: 1,
//     end: 3,
//     input: 'abcabc',
//     groups: null,
// }, {
//     matched: ['bc'],
//     start: 4,
//     end: 6,
//     input: 'abcabc',
//     groups: null,
// }]
```
```jora
'abc123a45'.match(/a(bc)?(?<numbers>\d+)/)
// Result: {
//     matched: ['abc123', 'bc', '123'],
//     start: 0,
//     end: 6,
//     input: 'abc123a45',
//     groups: { numbers: '123' },
// }
```
```jora
'abc123a45'.match(/a(bc)?(?<numbers>\d+)/g) // the RegExp has 'g' flag
// Result: [{
//     matched: ['abc123', 'bc', '123'],
//     start: 0,
//     end: 6,
//     input: 'abc123a45',
//     groups: { numbers: '123' },
// }, {
//     matched: ['a45', undefined, '45'],
//     start: 6,
//     end: 9,
//     input: 'abc123a45',
//     groups: { numbers: '45' },
// }]
```

## max(<!--compare-->)

The `max(compare)` method returns the maximum value from an array or a string, excluding `undefined`. It uses natural comparison for string values by default. When applied to an array, the method returns `undefined` if the array is empty or if a comparator function returns `0` for all values when compared with `undefined`.

The logic of the `max()` method is equivalent to the expressions `sort().[$ != undefined][-1]`. However, `max()` is more performant and memory efficient because it doesn't need to sort the entire array or string.

Here are some examples of how to use the `max()` method:

```jora
// Find the maximum number in an array
[1, 4, 2, 3].max()
// Result: 4
```

```jora
// Find the maximum object in an array based on a property
$input: [{ a: 10 }, { a: 42 }, {}, { a: 42, ok: 1 }, { a: 20 }];
$input.max(=> a)
// Result: { a: 42, ok: 1 }
```

```jora
// Find the minimum object in an array based on a property
$input: [{ a: 10 }, { a: 42 }, {}, { a: 20 }];
$input.max(a desc)
// Result: { a: 10 }
```

```jora
// Find the maximum character in a string
'hello world'.max()
// Result: 'w'
```

## median(<!--getter-->)

Computes the [median](https://en.wikipedia.org/wiki/Median) (the second [quartile](https://en.wikipedia.org/wiki/Quartile)) of the values in an array. It's a shortcut for `percentile(50)` or `p(50)` (see [percentile()](#percentile)).

```jora
[4, 2, 1, 3, 5].median()
// Result: 3
```
```jora
[4, 2, 1, 3, 6, 5].median()
// Result: 3.5
```

## min(<!--compare-->)

The `min()` method returns the minimum value from an array or a string. It uses natural comparison for string values by default. When applied to an array, the method returns `undefined` if the array is empty or if a comparator function returns `0` for all values when compared with `undefined`.

The logic of the `min()` method is equivalent to the expression `sort()[0]`. However, `min()` is more performant and memory efficient because it doesn't need to sort the entire array or string.

```jora
// Find the minimum number in an array
[4, 1, 2, 3].min()
// Result: 1
```
```jora
// Find the minimum object in an array based on a property using a function
$input: [{ a: 10 }, { a: 5, ok: 1 }, {}, { a: 5 }, { a: 20 }];
$input.min(=> a)
// Result: { a: 5, ok: 1 }
```
```jora
// Find the minimum object in an array based on a property using a compare function
$input: [{ a: 10 }, { a: 42 }, {}, { a: 20 }];
$input.min(a desc)
// Result: { a: 42 }
```
```jora
// Find the minimum character in a string
'hello world'.min()
// Result: ' '
```

## numbers(<!--getter-->)

The `numbers()` method returns an array of numbers derived from the input values. It ignores `undefined` values returned by the `getter` function (the default `getter` function is `=> $`, which returns the value itself). All other values are converted to numbers including `NaN` and `Infinity`. When converting a value to a number, any objects and arrays are converted to `NaN`.

The `numbers()` method is utilized internally by statistical methods such as `sum()`, `avg()`, and `count()`. As such, it can be used to reveal the numbers that are being used to compute the result of these methods.

```jora
[1, NaN, false, true, '123', { foo: 1 }, [5]].numbers()
// Result: [1, NaN, 0, 1, 123, NaN, NaN]
```
```jora
[1, 2, NaN, false, true, '123'].numbers()
// Result: [1, 2, NaN, 0, 1, 123]
```
```jora
[{ age: 10 }, {}, { age: 20 }, null, { age: 10 }].numbers(=> age)
// Result: [10, 20, 10]
```

> [!NOTE]
> When applying a statistical computation to an array of objects, it is recommended to use a custom `getter` with the method rather than using dot notation or mapping. This is because dot notation and mapping ignore duplicate values. For instance, the query `[…].age.numbers()` might return `[10, 20]` for the last example instead of the expected `[10, 20, 10]`, which would be correctly returned by the query `[…].numbers(=> age)`.

## p(<!--k, getter-->)

Alias for [`percentile()`](#percentile) method.

## percentile(<!--k, getter-->)

This function computes the [percentile](https://en.wikipedia.org/wiki/Percentile) of values in an array. It returns `undefined` if the input is an empty array, not an array, or if the `k` parameter is not specified or falls outside the range of `[0..100]`. The function utilizes the same numbers as the [`numbers()`](#numbers) method, given the same `getter` parameter. If the input (after processing through `getter`) contains a `NaN`, the function will always return `NaN`.

```jora
[4, 3, 5, 2, 1].percentile(75)
// Result: 4
```
```jora
[4, 3, 5, 6, 2, 1].percentile(20)
// Result: 2
```
```jora
[4, 3, 1].percentile() // k is not specified
// Result: undefined
```
```jora
[4, 3, NaN, 1].percentile(50)
// Result: NaN
```

Using custom `getter`:

```jora
[{ a: 1 }, { a: 3 }, undefined, { a: 2 }].percentile(75, => a)
// Result: 2.5
```

## pick()

Get a value by a key, index, or function. The method repeats behaviour of [Bracket notation](./bracket-notation.md), i.e. `expr.pick(…)` is the same as `expr[…]`.

```jora
[1, 2, 3, 4].pick(2)
// Result: 3
```
```jora
{ foo: 1, bar: 2 }.pick('bar')
// Result: 2
```

## reduce(<!--fn, initValue-->)

The same as `Array#reduce(fn, initValue)` in JS. Use `$$` to access the accumulator and `$` for the current value, e.g., find the max value:

```jora
[1, 5, 2, 3, 4].reduce(=>$ > $$ ? $ : $$)
// Result: 5
```

> [!NOTE]
> In Jora, function arguments order is always `$, $$`, but in JavaScript's `Array#reduce()`, the order is reversed.
With explicit arguments a function for Jora's reduce will be:
>
> ```jora
> reduce(($value, $acc) => $acc + $value, 0)
> ```
>
> The JavaScript equivalent:
>
> ```js
> reduce((acc, value) => acc + value, 0)
> ```

## replace(<!--pattern, replacement-->)

The same as `String#replaceAll()` in JavaScript, but also works for arrays. When `pattern` is RegExp, a `g` flags adds automatically if omitted. When applying to arrays it's similar to `.($ = pattern ? replacement : $)`, but without dropping duplicate values and inlining arrays.

```jora
'abc123def123xyz'.replace('123', '_')
// Result: "abc_def_xyz"
```
```jora
'abc123def45xyz'.replace(/[^\d]/, '_')
// Result: "___123___45___"
```
```jora
'2023-07-14'.replace(/(\d{4})-(\d{2})-(\d{2})/, '$3-$2-$1')
// Result: "14-07-2023"
```
```jora
'a 123 ... b 45'.replace(
    /([a-z]+)\s+(?<numbers>\d+)/,
    => `[numbers: ${groups.numbers} for '${matched[1]}']`
)
// Result: "[numbers: 123 for 'a'] ... [numbers: 45 for 'b']"
```
```jora
[1, 2, 3, 3, 2, 1].replace(2, null)
// Result: [1, null, 3, 3, null, 1]
```

## reverse()

Reverse order of elements in an array. Unlike JavaScript, doesn't modify input array but produce a new copy of it with the change (like [`Array#toReversed()`](https://github.com/tc39/proposal-change-array-by-copy)). For any values other than an array, returns the input value.

```jora
[1, 2, 5, 3].reverse()
// Result: [3, 5, 2, 1]
```
```jora
'hello world'.reverse()
// Result: 'hello world'
```

## size()

Returns count of entries in an object, otherwise returns `length` property value or `0` when the field is absent.

```jora
{ a: 42, b: 123 }.size()
// Result: 2
```
```jora
[1, 2, 3, 4].size()
// Result: 4
```
```jora
"Hello world".size()
// Result: 11
```
```jora
123.size()
// Result: 0
```

## slice(<!--from, to-->)

The same as `Array#slice()` and `String#slice()` in JavaScript (see also [Slice notation](./slice-notation.md)).

## sort(<!--compare-->)

Sort an array by a value fetched with getter (`fn`). Can use sorting function definition syntax with `asc` and `desc` (see [Sorting](./sort.md))

## split(<!--pattern-->)

The same as `String#split()` in JavaScript. `pattern` may be a string or regex.

## stdev(<!--getter-->)

Returns the [standard deviation](https://en.wikipedia.org/wiki/Standard_deviation) (`𝜎`) of a population, is the square root of the variance.

```jora
[2, 4, 6, 4].stdev()
// Result: 1.4142135623730951
```
```jora
[{ a: 2 }, {}, undefined, { a: 4 }].stdev(=> a)
// Result: 1
```

## sum(<!--getter-->)

Computes the sum of the values in an array. It returns `undefined` for non-array values and empty arrays. The method uses the same numbers as [`numbers()`](#numbers) method with the same `getter` parameter returns. The method employs the [Kahan–Babuška summation algorithm](https://en.wikipedia.org/wiki/Kahan_summation_algorithm) to minimize numerical errors in the result.

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

> [!NOTE]
> The `sum()` method returns `0.6` instead of `0.6000000000000001`, which is the result of the expression `0.1 + 0.2 + 0.3`. This is because the Kahan–Babuška summation algorithm is used to reduce numerical error.

Using a custom getter function:

```jora
[1, 2, 3, 4].sum(=> $ * $) // Sum of number squares
// Result: 30
```
```jora
[{ age: 10 }, {}, { age: 20 }, null, { age: 10 }].sum(=> age)
// Result: 40
```

Since arrays are always converting to `NaN`. To summing array of arrays, a summation of sums should be used:

```jora
[[1, 2], [], [4]].sum()
// Result: NaN
```
```jora
[[1, 2], [], null, [4], undefined].sum(=> sum())
// Result: 7
```

## toLowerCase(<!--locales-->)

The same as `String#toLocaleLowerCase()` in JavaScript.

```jora
'Hello World!'.toLowerCase()
// Result: "hello world!"
```

## toUpperCase(<!--locales-->)

The same as `String#toLocaleUpperCase()` in JavaScript.

```jora
'Hello World!'.toUpperCase()
// Result: "HELLO WORLD!"
```

## trim()

The same as `String#trim()` in JavaScript.

```jora
'   something in the middle   '.trim()
// Result: "something in the middle"
```

## values()

The same as `Object.values()` in JavaScript.

## variance(<!--getter-->)

Returns the [variance](http://en.wikipedia.org/wiki/Variance) (`𝜎²`) of a [population](https://en.wikipedia.org/wiki/Variance#Population_variance) (the squared deviation from the mean).

```jora
[2, 4, 6, 4].variance()
// Result: 2
```
```jora
[{ a: 2 }, {}, undefined, { a: 4 }].variance(=> a)
// Result: 1
```

## Math methods

JavaScript's [`Math`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math) methods.

Modifications from the standard JavaScript `Math` object include:
- The `log()` and `log1p()` methods have been renamed to `ln()` and `ln1p()`, respectively. This change was made to prevent confusion with the common usage of `log()` for logging purposes.
- The [`min()`](#min) and [`max()`](#max) methods have been uniquely implemented in Jora to provide additional functionality.
- The `random()` method is not included in Jora's Math methods, as it does not align with the deterministic nature of Jora.

> [!NOTE]
> The unary `-` operator has lower precedence than other operators. To apply a method to a negative scalar number, use the [grouping operator](./operators.md#grouping-operator), the [pipeline operator](./operators.md#pipeline-operator), or store the number in a [variable](./variables.md) and then apply the method to it. For example, instead of `-123.abs()`, which is interpreted as `-(123.abs())`, you should use one of the following:
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
2.expm1()
// Result: 6.38905609893065
```
```jora
(-1).expm1()
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

### ln()

Returns the natural logarithm (<code>log<sub>e</sub></code> or `ln`) of a number.

```jora
// 2^3 = 8
8.ln() / 2.ln()
// Result: 3
```

### log10()

Returns the base-10 logarithm of a number, i.e. <code>log<sub>10</sub>(x)</code>.

```jora
2.log10()
// Result: 0.3010299956639812
```

### ln1p()

Returns the natural logarithm (<code>log<sub>e</sub></code> or `ln`) of `1 + x` for the number `x`.

```jora
1.ln1p()
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
