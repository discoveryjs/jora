# Jora

[![NPM version](https://img.shields.io/npm/v/jora.svg)](https://www.npmjs.com/package/jora)
[![Build Status](https://github.com/discoveryjs/jora/actions/workflows/build.yml/badge.svg)](https://github.com/discoveryjs/jora/actions/workflows/build.yml)
[![Coverage Status](https://coveralls.io/repos/github/discoveryjs/jora/badge.svg?branch=master)](https://coveralls.io/github/discoveryjs/jora?branch=master)
[![Minified size](https://badgen.net/bundlephobia/min/jora)](https://bundlephobia.com/result?p=jora)
[![Minified + gzip size](https://badgen.net/bundlephobia/minzip/jora)](https://bundlephobia.com/result?p=jora)
[![Twitter](https://badgen.net/badge/follow/@js_discovery?icon=twitter)](https://twitter.com/js_discovery)

JavaScript object query engine

> STATUS: Jora is still very much work in progress ([ideas and thoughts](https://gist.github.com/lahmatiy/d5af7a987e9548e80eae5f46e6edc931)). Syntax may change in next releases. 

Features:

- Tolerant to data stucture queries (e.g. just returns *nothing* for paths that not reachable)
- Compact syntax for common tasks
- Aggregate values across arrays and eliminate duplicates by default
- Stat collecting mode (powers suggestions)
- Tolerant parsing mode (useful to provide suggestions for query in an editor)
- Extensible DSL on query build by custom method list

Related projects:

- [Discovery](https://github.com/discoveryjs/discovery) – Uses jora as core fuctionality to transform a data flow for views and query data for reports
- [JsonDiscovery](https://github.com/discoveryjs/browser-extension-json-discovery) – a browser’s extension based on Discovery for viewing JSON documents, available for [Chrome](https://chrome.google.com/webstore/detail/jsondiscovery/pamhglogfolfbmlpnenhpeholpnlcclo) and [Firefox](https://addons.mozilla.org/en-GB/firefox/addon/jsondiscovery/) (read more [Changing a way we’re viewing JSON in a browser](https://medium.com/@rdvornov/changing-a-way-were-viewing-json-in-a-browser-51eda9103fa2))
- [jora-cli](https://github.com/discoveryjs/jora-cli) – Command line interface for transforming data using Jora
- [Jora sandbox](https://discoveryjs.github.io/jora-sandbox/) – A Web interface where you can play with jora syntax or transform some JSON with zero setup

Table of content:

<!-- TOC depthfrom:2 -->

- [Install](#install)
- [Quick demo](#quick-demo)
- [API](#api)
    - [Query introspection](#query-introspection)
- [Syntax](#syntax)
    - [Comments](#comments)
    - [Numbers](#numbers)
    - [Hexadecimal numbers](#hexadecimal-numbers)
    - [Strings](#strings)
    - [Regular expressions](#regular-expressions)
    - [Object literals](#object-literals)
    - [Array literals](#array-literals)
    - [Functions](#functions)
    - [Keywords](#keywords)
    - [Operators](#operators)
    - [Comparisons](#comparisons)
    - [Boolean logic](#boolean-logic)
    - [Block & definitions](#block--definitions)
    - [Special references](#special-references)
    - [Path chaining](#path-chaining)
    - [Build-in methods](#build-in-methods)
- [License](#license)

<!-- /TOC -->

## Install

Install with npm:

```
npm install jora
```

Basic usage:

```js
// ESM
import jora from 'jora';

// CommonJS
const jora = require('jora');
```

Bundles are available for use in a browser:

- `dist/jora.js` – minified IIFE with `jora` as global
```html
<script src="node_modules/jora/dist/jora.js"></script>
<script>
  jora('query')(data, context);
</script>
```

- `dist/jora.esm.js` – minified ES module
```html
<script type="module">
  import jora from 'node_modules/jora/dist/jora.esm.js'
  jora('query')(data, context);
</script>
```

One of CDN services like `unpkg` or `jsDelivr` can be used. By default (for short path) a ESM version is exposing. For IIFE version a full path to a bundle should be specified:

```html
<!-- ESM -->
<script type="module">
  import jora from 'https://cdn.jsdelivr.net/npm/jora';
  import jora from 'https://unpkg.com/jora';
</script>

<!-- IIFE with an export `jora` to global -->
<script src="https://cdn.jsdelivr.net/npm/jora/dist/jora.js"></script>
<script src="https://unpkg.com/jora/dist/jora.js"></script>
```

## Quick demo

Get npm dependency paths (as a tree) that have packages with more than one version:

```js
import jora from 'jora';
import { exec } from 'child_process';

function printTree() {
    // see implementation in examples/npm-ls.js
}

exec('npm ls --all --json', (error, stdout) => {
    if (error) {
        return;
    }

    const npmTree = JSON.parse(stdout);
    const depsPathsToMultipleVersionPackages = jora(`
        $normalizedDeps: => dependencies.entries().({ name: key, ...value });
        $multiVersionPackages:
            ..$normalizedDeps()
            .group(=>name, =>version)
            .({ name: key, versions: value.sort() })
            .[versions.size() > 1];

        $pathToMultiVersionPackages: => .($name; {
            name,
            version,
            otherVersions: $multiVersionPackages[=>name=$name].versions - version,
            dependencies: $normalizedDeps()
                .$pathToMultiVersionPackages()
                .[name in $multiVersionPackages.name or dependencies]
        });

        $pathToMultiVersionPackages()
    `)(npmTree);

    printTree(depsPathsToMultipleVersionPackages);
});
```

Example of output:

```
jora@1.0.0
├─ c8@7.11.0
│  ├─ istanbul-lib-report@3.0.0
│  │  └─ supports-color@7.2.0 [more versions: 8.1.1]
│  ├─ test-exclude@6.0.0
│  │  └─ minimatch@3.1.2 [more versions: 3.0.4]
│  ├─ v8-to-istanbul@8.1.1
│  │  └─ convert-source-map@1.8.0
│  │     └─ safe-buffer@5.1.2 [more versions: 5.2.1]
│  ├─ yargs-parser@20.2.9 [more versions: 20.2.4]
│  └─ yargs@16.2.0
│     └─ yargs-parser@20.2.9 [more versions: 20.2.4]
├─ eslint@8.10.0
│  ├─ @eslint/eslintrc@1.2.0
│  │  ├─ ignore@4.0.6 [more versions: 5.2.0]
│  │  └─ minimatch@3.1.2 [more versions: 3.0.4]
...
```

## API

```js
import jora from 'jora';

// create a query
const query = jora('foo.bar');
// or with custom methods
const queryWithCustomMethods = jora.setup({
    myMethod(current) { /* do something and return a new value */ }
});

// perform a query
const result = query(data, context);
const result = queryWithCustomMethods('foo.myMethod()')(data, context);
```

Options:

- methods

  Type: `Object`  
  Default: `undefined`

  Additional methods for using in query passed as an object, where a key is a method name and a value is a function to perform an action. It can override build-in methods.

- debug

  Type: `Boolean` or `function(name, value)`  
  Default: `false`

  Enables debug output. When set a function, this function will recieve a section name and its value.

- tolerant

  Type: `Boolean`  
  Default: `false`

  Enables tolerant parsing mode. This mode supresses parsing errors when possible.

- stat

  Type: `Boolean`  
  Default: `false`

  Enables stat mode. When mode is enabled a query stat interface is returning instead of resulting data.
### Query introspection

To introspect a query, it should be compiled in "stat" (statistic) mode by passing a `stat` option. In this case a result of the query evaluation will be a special API with encapsulated state instead of a value:

```js
import jora from 'jora';

const query = jora('...query...', { stat: true });
const statApi = query(data);
// { stat() { ... }, suggestion() { ... }, ... }
```

The returned API allows fetching the values which are passed through a location in a query (the `stat()` method) as well as a list of suggestions for a location (the `suggestion()` method):

```js
import jora from 'jora';

const query = jora('.[foo=""]', { stat: true });
const statApi = query([{ id: 1, foo: "hello" }, { id: 2, foo: "world" }]);

statApi.stat(3);
// [
//   {
//     context: 'path',
//     from: 2,
//     to: 5,
//     text: 'foo',
//     values: Set(2) { [Object], [Object] },
//     related: null
//   }
// ]

statApi.suggestion(3); // .[f|oo=""]
// [
//   {
//     type: 'property',
//     from: 2,
//     to: 5,
//     text: 'foo',
//     suggestions: [ 'id', 'foo' ]
//   }
// ]

statApi.suggestion(7); // .[foo="|"]
// [
//   {
//     type: 'value',
//     from: 6,
//     to: 8,
//     text: '""',
//     suggestions: [ 'hello', 'world' ]
//   }
// ]
```

That's an effective way to use stat mode together with `tolerant` mode for incomplete queries:

```js
import jora from 'jora';

const query = jora('.[foo=]', {
    stat: true,
    tolerant: true // without the tolerant option a query compilation
                   // will raise a parse error:
                   // .[foo=]
                   // ------^
});
const statApi = query([{ id: 1, foo: "hello" }, { id: 2, foo: "world" }]);

statApi.suggestion(6); // .[foo=|]
// [
//   {
//     type: 'value',
//     from: 6,
//     to: 6,
//     text: '',
//     suggestions: [ 'hello', 'world' ]
//   },
//   {
//     type: 'property',
//     from: 6,
//     to: 6,
//     text: '',
//     suggestions: [ 'id', 'foo' ]
//   }
// ]
```

#### Methods

- `stat(pos: number, includeEmpty?: boolean)`

    Returns an array of ranges with all the values which are passed through `pos` during performing a query.

    Output format:

    ```ts
        suggestion(): Array<{
            context: 'path' | 'key' | 'value' | 'in-value' | 'value-subset' | 'var',
            from: number,
            to: number,
            text: string,
            values: Set<any>,
            related: Set<any> | null
        }> | null
    ```

- `suggestion(pos: number, options?)`

    Returns suggesion values grouped by a type or `null` if there is no any suggestions. The following options are supported (all are optional):
    - `limit` (default: `Infinity`) – a max number of the values that should be returned for each value type (`"property"`, `"value"` or `"variable"`)
    - `sort` (default: `false`) – a comparator function (should take 2 arguments and return a negative number, `0` or a positive number) for value list sorting, makes sence when `limit` is used
    - `filter` (default: `function`) – a filter function factory (`pattern => value => <expr>`) to discard values from the result when returns a falsy value (default is equivalent to `patttern => value => String(value).toLowerCase().includes(pattern)`)

    Output format:

    ```ts
        suggestion(): Array<{
            type: 'property' | 'value' | 'variable',
            from: number,
            to: number,
            text: string,
            suggestions: Array<string | number>
        }> | null
    ```

## Syntax

### Comments

```
// single-line comment
/* multi-line
comment */
```

### Numbers

```js
42
-123
4.22
1e3
1e-2
```

### Hexadecimal numbers

```js
0xdecaf
-0xC0FFEE
```

### Strings

```js
"string"
'string'
`template ${hello} ${world}`
```

[Escape sequences](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String#escape_sequences) are supported as well as an escaping to continue a string on next line:

```js
"\u2013 This is a very long string which needs \
to wrap across multiple lines because \
otherwise my code is unreadable\x21"
```

### Regular expressions

The same as in JavaScript. Supported flags: `i`, `g`, `m`, `s` and `u`

```js
/regexp/
/regexp/mi
```

### Object literals

Object initializer/literal syntax is the same as in JavaScript:

```js
{ foo: 123, bar: true }
```

Spread operator (`...`) can be used in object literals as well, e.g. `{ a: 1, ..., ...foo }`. When spread operator used with no expression on the right side it's the same as `...$`.

### Array literals

Array initializer/literal syntax is the same as in JavaScript:

```js
[1, 'foo', { prop: 123 }]
```

Spread operator (`...`) can be used, e.g. `[1, ...arr]`, but unlike JavaScript, spread operator in jora only inlines arrays and left as is any other values:

```js
[...[1, 2], ...3, ..."45", { "6": 7 }] // -> [1, 2, 3, "45", { "6": 7 }]
```

When spread operator used with no expression on the right side it's the same as `...$`.

### Functions

```js
=> expr
```

> NOTE: The depricated syntax `< block >` is still supported, but avoid to use it since it will be removed in next releases.

There are several ways to define a comparator function. Such functions (a sorting function) take two arguments and compare a query result for each in specified order (`asc` – ascending, `desc` – descending):

```js
expr asc  // JS: (a, b) => expr(a) > expr(b) ? 1 : expr(a) < expr(b) ? -1 : 0
```

```js
expr desc // JS: (a, b) => expr(a) < expr(b) ? 1 : expr(a) > expr(b) ? -1 : 0
```

A comma separated sequence defines a single function:

```js
foo asc, bar desc // JS: (a, b) =>
                  //       a.foo > b.foo ? 1 : a.foo < b.foo ? -1 :
                  //       a.bar < b.bar ? 1 : a.bar > b.bar ? -1 :
                  //       0
```

There are some modification for `asc` and `desc`:

- `ascN` / `descN` – natural sorting (using [@discoveryjs/natural-compare](https://github.com/discoveryjs/natural-compare))
- `ascA` / `descA` – the same as `asc` / `desc` but reverse order for numbers
- `ascAN` / `descAN` – the same as `asc`/`desc` but using natural compare and reverse order for numbers

### Keywords

Following keywords can be used with the same meaning as in JavaScript:

- `true`
- `false`
- `null`
- `undefined`
- `Infinity`
- `NaN`

### Operators

<table>
<tr>
    <th>Jora
    <th>Description
</tr>
<tr>
    <td nowrap valign="top">x + y
    <td>Add<br>In case one of the operands is an array it produces new array with elements from `x` and `y` excluding duplicates
</tr><tr>
    <td nowrap valign="top">x - y
    <td>Subtract<br>In case one of the operands is an array with elements from `x` excluding elements from `y`
</tr><tr>
    <td nowrap>x * y
    <td>Multiply
</tr><tr>
    <td nowrap>x / y
    <td>Divide
</tr><tr>
    <td nowrap>x % y
    <td>Modulo
</tr>
</table>

### Comparisons

Jora | Description
--- | ---
x = y | Equals (as `===` in JS)
x != y | Not equals (as `!==` in JS)
x < y | Less than
x <= y | Less than or equal to
x > y | Greater than
x >= y | Greater than or equal to
x ~= y | Match operator, behaviour depends on `y` type:<br>RegExp – test against regexp<br>function – test like `filter()`<br>`null` or `undefined` – always truthy<br>anything else – always falsy

### Boolean logic

Jora | Description
--- | ---
( x ) | Explicity operator precedence. Definitions are allowed (i.e. `($a: 1; $a + $a)` see bellow)
x or y | Boolean `or`.<br>Equivalent to `\|\|` in JS, but `x` tests with `bool()` method
x and y | Boolean `and`.<br>Equivalent to `&&` in JS, but `x` tests with `bool()` method
not x<br>no x | Boolean `not`.<br>Equivalent to `&&` in JS, but `x` tests with `bool()` method
x ? y : z | If `x` is truthy than return `y` else return `z`. `x` tests with `bool()` method
x in [a, b, c]<br>[a, b, c] has x | Equivalent to `x = a or x = b or x = c`
x not in [a, b, c]<br>[a, b, c] has no x | Equivalent to `x != a and x != b and x != c`

### Block & definitions

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

### Special references

Jora | Description
--- | ---
$ | A scope input data (current value). On top level scope it's the same as `@`. In most cases it may be omitted. Used implicitly an input for subquery when no other subjects is defined (e.g. `foo()` and `.foo()` are equivalent for `$.foo()`).
$$ | A reference to the second parameter of closest function or undefined when no such
@ | A query input data
\# | A query context

Since Jora's query performs as `query(data, context)`, in terms of Jora it looks like `query(@, #)`.

### Path chaining

jora | Description
--- | ---
ident | The same as `$.ident`
.ident | Child member operator (example: `foo.bar.baz`, `#.foo['use any symbols for name']`)
..ident<br>..( block ) | Recursive descendant operator (example: `..deps`, `..(deps + dependants)`)
.[ block ] | Filter a current data. Equivalent to a `.filter(=>(block))` or `.filter(=>expr)` when a block has no definitions
.( block ) | Map a current data. Equivalent to a `.map(=>(block))` or `.map(=>expr)` when a block has no definitions
method()<br>.method()<br>..$method() | Invoke a method to current value, where `$method` is a reference to definition value (i.e. `$example: => $ * 10; 2.$plural(["example", "examples"])`). Can take arguments (i.e. `$method(one, 2)`).
$method()<br>.$method()<br>..method() | Invoke a method to current value. See [build-in methods below](#build-in-methods)
path[expr] | Array-like notation to access properties. Behaves like `pick()` method. In case you need to fetch a value to each element of array use `.($[expr])` or `map(=>$[expr])`
[from:to]<br>[from:to:step] | [Slice notation](https://github.com/tc39/proposal-slice-notation/blob/master/README.md). Examples: `$str: '<foo>'; str[1:-1]` (result is `'foo'`) or `$ar:[1,2,3,4,5,6]; $ar[-3::-1]` (result is `[6,5,4]`)
expr \| [definitions] expr \| ... | Pipeline operator. It's useful to make a query value as current value. Approximately this effect can be obtained using variables: `$ar: [1,2,3]; { size: $ar.size(), top2: $ar[0:2] }`. However, with pipeline operator it's a bit simplier and clear: `[1,2,3] | { size: size(), top2: [0:2] }`

### Build-in methods

jora | Description
--- | ---
bool() | The same as `Boolean()` in JS, with exception that *empty arrays* and *objects with no keys* treats as falsy
keys() | The same as `Object.keys()` in JS
values() | The same as `Object.values()` in JS
entries() | Similar to `Object.entries()` in JS with a difference: `{ key, value }` objects is using for entries instead of array tuples
fromEntries() | Similar to `Object.fromEntries()` in JS with difference: `{ key, value }` objects are expecting as entries instead of array tuples
pick("key")<br>pick(index)<br>pick(fn) | Get a value by a key, an index or a function. It returns an element with `e` index for arrays, a char with `e` index for strings, and a value with `e` key (must be own key) for enything else. Negative indecies are supported for arrays and strings. Current value is element for an array, a char for a string or an entry value for object. Arg1 (i.e. `$$`) is an index for arrays and strings, and a key for objects.
size() | Returns count of keys if current data is object, otherwise returns `length` value or `0` when field is absent
sort(fn) | Sort an array by a value fetched with getter (`<fn>`). Keep in mind, you can use sorting function definition syntax using `asc` and `desc` keywords, qhich is more effective in many ways. In case of sorting function definition usage, `<` and `>` are not needed and you can specify sorting order for each component. The following queries are equivalent:<br>`sort(=> foo.bar)` and `sort(foo.bar asc)`<br>`sort(=> foo).reverse()` and `sort(foo desc)`<br>`sort(=> [a, b])` and `sort(a asc, b asc)`
reverse() | Reverse order of items
group(fn[, fn]) | Group an array items by a value fetched with first getter and return an array of `{ key, value }` entries. The second parameter is used to fetch a value, the following queries are equivalent:<br>`group(=> foo, => bar)` and `group(=> foo).({ key, value: value.bar })`
filter(fn) | The same as `Array#filter()` in JS
map(fn) | The same as `Array#map()` in JS
split(pattern) | The same as `String#split()` in JS. `pattern` may be a string or regexp
join(separator) | The same as `Array#join()` in JS. When `separator` is undefined then `","` is using
slice(from, to) | The same as `Array#slice()` or `String#slice()` in JS
match(pattern, matchAll?) | Similar to `String#match()`. `pattern` might be a RegExp or string. When `matchAll` is truthy then returns an array of all occurrences of the `pattern`. Expressions `match(/../g)` and `match(/../, true)` are equivalent.
reduce(fn\[, initValue]) | The same as `Array#reduce()` in JS. Use `$$` to access to accumulator and `$` to current value, e.g. find the max value `reduce(=>$ > $$ ? $ : $$)`

## License

MIT
