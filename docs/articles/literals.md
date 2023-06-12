# Literals

Literals in Jora are mostly the same as in JavaScript. 

- [Numbers](#numbers)
- [Hexadecimal numbers](#hexadecimal-numbers)
- [Strings](#strings)
- [Regular expressions](#regular-expressions)
- [Object literals](#object-literals)
- [Array literals](#array-literals)
- [Functions](#functions)
- [Keywords](#keywords)

## Numbers

```jora
42
-123
4.22
1e3
1e-2
```

## Hexadecimal numbers

```jora
0xdecaf
-0xC0FFEE
```

## Strings

```jora
"string"
'string'
`template ${hello} ${world}`
```

[Escape sequences](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String#escape_sequences) are supported, as well as escaping to continue a string on the next line:

```jora
"\u2013 This is a very long string which needs \
to wrap across multiple lines because \
otherwise, my code is unreadable\x21"
```

## Regular expressions

The same as in JavaScript. Supported flags: `i`, `g`, `m`, `s`, and `u`

```jora
/regexp/
/regexp/mi
```

## Object literals

Object initializer/literal syntax is the same as in JavaScript:

```jora
{ foo: 123, bar: true }
```

See [Object literals](./object-literal.md) for details.

## Array literals

Array initializer/literal syntax is the same as in JavaScript:

```jora
[1, 'foo', { prop: 123 }]
```

See [Array literals](./array-literal.md) for details.

### Functions

```jora
=> expr
```

There are several ways to define a comparator function (see [Sorting](./sort.md) for details):

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
