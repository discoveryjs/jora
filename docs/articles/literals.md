# Literals

Literals in Jora are mostly the same as in JavaScript. 

- [Numbers](#numbers)
- [Strings](#strings)
- [Regular expressions](#regular-expressions)
- [Objects](#objects)
- [Arrays](#arrays)
- [Functions](#functions)
- [Keywords](#keywords)

## Numbers

```jora
42         // integer number
```
```jora
-123       // negative number
```
```jora
4.22       // float number
```
```jora
1e3        // exponential number
```
```jora
1e-2       // exponential number
```
```jora
0xdecaf    // hexadecimal number
```
```jora
-0xC0FFEE  // hexadecimal number
```

An underscore (`_`) can be used as a numerical separator:

```jora
1_000
```
```jora
1_345.678_901
```
```jora
0x12_34_56_78
```

## Strings

```jora
"string"
```
```jora
'string'
```
```jora
`template string ${hello} ${world}`
```

[Escape sequences](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#escape_sequences) are supported, as well as a new line escaping to continue a string on the next line:

```jora
"\u2013 This is \"a very long\" string which needs \
to wrap across multiple lines because \
otherwise, my code is unreadable\x21"
```

## Regular expressions

The same as in JavaScript. Supported flags: `i`, `g`, `m`, `s` and `u`.

```jora
/regexp/
```
```jora
/regexp/mi
```

## Objects

Object literal syntax is the same as in JavaScript (see [Object literals](./object-literal.md)):

```jora
{ foo: 123, bar: true }
```

## Arrays

Array literal syntax is the same as in JavaScript (see [Array literals](./array-literal.md)):

```jora
[1, 'foo', { prop: 123 }]
```

## Functions

A function defintion looks like an arrow function in JavaScript but without arguments (see [Regular functions](./functions.md#regular-functions)):

```jora
=> expr
```

There is also a syntax to define a comparator function (see [Comparator functions](./functions.md#comparator-functions)):

```jora
name asc, age desc
```

## Keywords

The following keywords can be used with the same meaning as in JavaScript:

- `true`
- `false`
- `null`
- `undefined`
- `Infinity`
- `NaN`
