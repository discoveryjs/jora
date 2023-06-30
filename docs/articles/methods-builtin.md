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

Return max value from an array of string, excluding `undefined`. The method returns `undefined` when there are no values (i.e. an empty array) or a comparator returns `0` for all values when compared with `undefined`.

The logic of `max()` method equivalent (but more performant and memory efficient) to the following expression:
- no comparator: `sort().[$ != undefined][-1]`
- with comparator: `sort(compare).[compare($, undefined) != 0][-1]`

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

Return min value from an array of string. The method returns `undefined` when there are no values (i.e. an empty array) or a comparator returns `0` for all values when compared with `undefined`.

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

The same as `Array#reduce()` in JS. Use `$$` to access the accumulator and `$` for the current value, e.g., find the max value `reduce(=>$ > $$ ? $ : $$)`.

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

## toLowerCase(locales)

The same as `String#toLocaleLowerCase()` in JavaScript.

## toUpperCase(locales)

The same as `String#toLocaleUpperCase()` in JavaScript.

## trim()

The same as `String#trim()` in JavaScript.

## values()

The same as `Object.values()` in JavaScript.

## Math methods

JavaScript's [`Math`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math) methods

### abs()

### acos()

### acosh()

### asin()

### asinh()

### atan()

### atan2()

### atanh()

### cbrt()

### ceil()

### clz32()

### cos()

### cosh()

### exp()

### expm1()

### floor()

### fround()

### hypot()

### imul()

### log()

### log10()

### log1p()

### log2()

### pow()

### round()

### sign()

### sin()

### sinh()

### sqrt()

### tan()

### tanh()

### trunc()
