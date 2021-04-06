## Comments

```jora
// single-line comment
/* multi-line
...
comment */
```

## Primitives

Jora | Description
--- | ---
42<br>-123<br>4.22<br>1e3<br>1e-2 | Numbers
0xdecaf<br>-0xC0FFEE | Hexadecimal numbers
"string"<br>'string' | Strings
\`template line1<br>template line2\`<br>\`template ${hello} ${world}` | Template
/regexp/<br>/regexp/i | A JavaScript regexp, only `i` flag supported
{ } | Object initializer/literal syntax. Spread operator (`...`) can be used, e.g. `{ a: 1, ..., ...foo }` (`...` with no expression on right side the same as `...$`)
[ ] | Array initializer/literal syntax. Spread operator (`...`) can be used, e.g. `[1, ..., ...foo]` (`...` with no expression on right side the same as `...$`). Unlike JavaScript, spread operator in jora inlines arrays only and left as is any other values, i.e. `[...[1, 2], ...3, ..."45", { "6": 7 }]` -> `[1, 2, 3, "45", { "6": 7 }]`
=> e<br>< block > (deprecated) | A function<br>NOTE: Syntax `< block >` is deprecated, avoid to use it
query asc<br>query desc<br>query asc, query desc, ... | A sorting function that takes two arguments and compare query result for each in specified order (`asc` – ascending, `desc` – descending)
query ascN<br>query descN | The same as `asc`/`desc` but natural sorting
query ascA<br>query descA | The same as `asc`/`desc` but reverse order for numbers
query ascAN<br>query descAN | The same as `asc`/`desc` but natural sorting and reverse order for numbers

## Keywords

Following keywords can be used with the same meaning as in JavaScript:

- `true`
- `false`
- `null`
- `undefined`
- `Infinity`
- `NaN`

## Operators

<table class="view-table">
<thead><tr class="view-table-row">
    <th>Jora
    <th>Description
</tr></thead>
<tr class="view-table-row">
    <td nowrap valign="top">x + y
    <td>Add<br>In case one of the operands is an array it produces new array with elements from `x` and `y` excluding duplicates
</tr><tr class="view-table-row">
    <td nowrap valign="top">x - y
    <td>Subtract<br>In case one of the operands is an array with elements from `x` excluding elements from `y`
</tr><tr class="view-table-row">
    <td nowrap>x * y
    <td>Multiply
</tr><tr class="view-table-row">
    <td nowrap>x / y
    <td>Divide
</tr><tr class="view-table-row">
    <td nowrap>x % y
    <td>Modulo
</tr>
</table>

## Comparisons

Jora | Description
--- | ---
x = y | Equals (as `===` in JS)
x != y | Not equals (as `!==` in JS)
x < y | Less than
x <= y | Less than or equal to
x > y | Greater than
x >= y | Greater than or equal to
x ~= y | Match operator, behaviour depends on `y` type:<br>RegExp – test against regexp<br>function – test like `filter()`<br>`null` or `undefined` – always truthy<br>anything else – always falsy

## Boolean logic

Jora | Description
--- | ---
( x ) | Explicity operator precedence. Definitions are allowed (i.e. `($a: 1; $a + $a)` see bellow)
x or y | Boolean `or`.<br>Equivalent to `\|\|` in JS, but `x` tests with `bool()` method
x and y | Boolean `and`.<br>Equivalent to `&&` in JS, but `x` tests with `bool()` method
not x<br>no x | Boolean `not`.<br>Equivalent to `&&` in JS, but `x` tests with `bool()` method
x ? y : z | If `x` is truthy than return `y` else return `z`. `x` tests with `bool()` method
x in [a, b, c]<br>[a, b, c] has x | Equivalent to `x = a or x = b or x = c`
x not in [a, b, c]<br>[a, b, c] has no x | Equivalent to `x != a and x != b and x != c`

## Block & definitions

Some constructions suppose to use a block, which may consists of a variable definition list (should comes first) and an expression. Both are optional. When an expression is empty, a current value (i.e. `$`) returns.

The syntax of definition (white spaces between any part are optional):

```
$ident ;
$ident : expression ;
```

For example:

```
$foo:123;          // Define `$foo` variable
$bar;              // The same as `$bar:$.bar;` or `$a: bar;`
$baz: $foo + $bar; // Definitions may be used in following expressions
```

In terms of JavaScript, a block creates a new scope. Once a variable is defined, its value never change. Variables can be redefined in nested scopes, but can't be duplicated in the same scope - it causes to error.

## Special references

Jora | Description
--- | ---
$ | A scope input data (current value). On top level scope it's the same as `@`. In most cases it may be omitted. Used implicitly an input for subquery when no other subjects is defined (e.g. `foo()` and `.foo()` are equivalent for `$.foo()`).
$$ | A reference to the second parameter of closest function or undefined when no such
@ | A query input data
\# | A query context

Since Jora's query performs as `query(data, context)`, in terms of Jora it looks like `query(@, #)`.

## Path chaining

jora | Description
--- | ---
ident | The same as `$.ident`
.ident | Child member operator (example: `foo.bar.baz`, `#.foo['use any symbols for name']`)
..ident<br>..( block ) | Recursive descendant operator (example: `..deps`, `..(deps + dependants)`)
.[ block ] | Filter a current data. Equivalent to a `.filter(<block>)`
.( block ) | Map a current data. Equivalent to a `.map(<block>)`
method()<br>.method()<br>..$method() | Invoke a method to current value, where `$method` is a reference to definition value (i.e. `$example: => $ * 10; 2.$plural(["example", "examples"])`). Can take arguments (i.e. `$method(one, 2)`).
$method()<br>.$method()<br>..method() | Invoke a method to current value. See [build-in methods below](#build-in-methods)
path[expr] | Array-like notation to access properties. Behaves like `pick()` method. In case you need to fetch a value to each element of array use `.($[expr])` or `map(=>$[expr])`
[from:to]<br>[from:to:step] | [Slice notation](https://github.com/tc39/proposal-slice-notation/blob/master/README.md). Examples: `$str: '<foo>'; str[1:-1]` (result is `'foo'`) or `$ar:[1,2,3,4,5,6]; $ar[-3::-1]` (result is `[6,5,4]`)
expr \| [definitions] expr \| ... | Pipeline operator. It's useful to make a query value as current value. Approximately this effect can be obtained using variables: `$ar: [1,2,3]; { size: $ar.size(), top2: $ar[0:2] }`. However, with pipeline operator it's a bit simplier and clear: `[1,2,3] | { size: size(), top2: [0:2] }`
