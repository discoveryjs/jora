# Jora

[![NPM version](https://img.shields.io/npm/v/jora.svg)](https://www.npmjs.com/package/jora)
[![Build Status](https://travis-ci.org/discoveryjs/jora.svg?branch=master)](https://travis-ci.org/discoveryjs/jora)
[![Coverage Status](https://coveralls.io/repos/github/discoveryjs/jora/badge.svg?branch=master)](https://coveralls.io/github/discoveryjs/jora?branch=master)
[![Minified size](https://badgen.net/bundlephobia/min/jora)](https://bundlephobia.com/result?p=jora)
[![Minified + gzip size](https://badgen.net/bundlephobia/minzip/jora)](https://bundlephobia.com/result?p=jora)
[![Twitter](https://badgen.net/badge/follow/@js_discovery?icon=twitter)](https://twitter.com/js_discovery)

JavaScript object query engine

> STATUS: Jora is still very much work in progress. Syntax may change in next releases.

Features:

- Tolerant to data stucture queries (e.g. just returns *nothing* for paths that not reachable)
- Compact syntax for common tasks
- Aggregate values across arrays and eliminate duplicates by default
- Stat collecting mode (powers suggestions)
- Tolerant parsing mode (useful to provide suggestions for query in an editor)
- Extensible DSL on query build by custom method list

Related projects:

- [jora-cli](https://github.com/discoveryjs/jora-cli) – Command line interface for Jora
- [Jora sandbox](https://discoveryjs.github.io/jora-sandbox/) – A Web interface where you can play with jora syntax or transform some JSON with zero setup
- [Discovery](https://github.com/discoveryjs/discovery) – Uses jora to query a data for views
- [JsonDiscovery](https://github.com/discoveryjs/browser-extension-json-discovery) – a browser’s extension for viewing JSON based on Discovery, available for [Chrome](https://chrome.google.com/webstore/detail/jsondiscovery/pamhglogfolfbmlpnenhpeholpnlcclo) and [Firefox](https://addons.mozilla.org/en-GB/firefox/addon/jsondiscovery/) (read more in the article [Changing a way we’re viewing JSON in a browser](https://medium.com/@rdvornov/changing-a-way-were-viewing-json-in-a-browser-51eda9103fa2))

TODO:

- [x] AST
- [ ] Immutable paths hoisting (reduce computations -> performance)
- [ ] Smart computation caching across queries
- [ ] Query parts performance stat
- [ ] Query transforming, e.g. query merge, subquery to a query, context inlining
- [ ] Method namespaces, e.g. semver, path, math etc
- [ ] Syntax highlighting
- [ ] Prettifier
- [x] Move jison to dev dependencies
- [ ] Debugging (step by step evaluation)
- [ ] Input data shape prediction suitable for a query (based on touching paths)

> More ideas and thoughts: [Jora todo gist](https://gist.github.com/lahmatiy/d5af7a987e9548e80eae5f46e6edc931), [Jora ToDo on Discovery.js projects state overview](https://docs.google.com/document/d/1z89UAY6Z8CP6VHX11-0yc1irD7WhAOM4F8X9RR1h1QQ/edit#heading=h.cm1jq2rux492)

Table of content:

<!-- TOC depthfrom:2 -->

- [Install](#install)
- [API](#api)
- [Quick demo](#quick-demo)
- [Syntax](#syntax)
    - [Comments](#comments)
    - [Primitives](#primitives)
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

```
npm install jora
```

In node.js

```js
const jora = require('jora');
```

For a browser unminified (`dist/jora.js`) and minified (`dist/jora.min.js`) builds are available:

```html
<script src="node_modules/jora/dist/jora.js"></script>
<script src="node_modules/jora/dist/jora.min.js"></script>
<!-- or use one of CDN -->
<script src="https://unpkg.com/jora/dist/jora.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jora/dist/jora.js"></script>
```

## API

```js
const jora = require('jora');

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

## Quick demo

Get npm dependency paths (as a tree) that have packages with more than one version:

```js
const jora = require('jora');

function printTree() {
    // see implementation in examples/npm-ls.js
}

require('child_process').exec('npm ls --json', (error, stdout) => {
    if (error) {
        return;
    }

    const npmTree = JSON.parse(stdout);
    const tree = JSON.parse(stdout);
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
    `)(tree);

    printTree(depsPathsToMultipleVersionPackages);
});
```

Example of output:

```
jora@1.0.0
├─ browserify@16.2.2
│  ├─ assert@1.4.1
│  │  └─ util@0.10.3 [other versions: 0.10.4]
│  │     └─ inherits@2.0.1 [other versions: 2.0.3]
│  ├─ browser-pack@6.1.0
│  │  └─ combine-source-map@0.8.0
│  │     ├─ source-map@0.5.7 [other versions: 0.6.1, 0.4.4, 0.2.0, 0.1.43]
│  │     └─ inline-source-map@0.6.2
│  │        └─ source-map@0.5.7 [other versions: 0.6.1, 0.4.4, 0.2.0, 0.1.43]
│  ├─ browser-resolve@1.11.3
│  │  └─ resolve@1.1.7 [other versions: 1.8.1]
│  ├─ concat-stream@1.6.2
│  │  └─ inherits@2.0.3 [other versions: 2.0.1]
...
```

## Syntax

### Comments

```
// single-line comment
/* multi-line
comment */
```

### Primitives

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
.[ block ] | Filter a current data. Equivalent to a `.filter(<block>)`
.( block ) | Map a current data. Equivalent to a `.map(<block>)`
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
sort(\<fn>) | Sort an array by a value fetched with getter (`<fn>`). Keep in mind, you can use sorting function definition syntax using `asc` and `desc` keywords, qhich is more effective in many ways. In case of sorting function definition usage, `<` and `>` are not needed and you can specify sorting order for each component. Following queries are equivalents:<br>`sort(<foo.bar>)` and `sort(foo.bar asc)`<br>`sort(<foo>).reverse()` and `sort(foo desc)`<br>`sort(<[a, b]>)` and `sort(a asc, b asc)`
reverse() | Reverse order of items
group(\<fn>[, \<fn>]) | Group an array items by a value fetched with first getter.
filter(\<fn>) | The same as `Array#filter()` in JS
map(\<fn>) | The same as `Array#map()` in JS
split(pattern) | The same as `String#split()` in JS. `pattern` may be a string or regexp
join(separator) | The same as `Array#join()` in JS. When `separator` is undefined then `","` is using
slice(from, to) | The same as `Array#slice()` or `String#slice()` in JS
match(pattern, matchAll) | Similar to `String#match()`. Since regexp'es in jora doesn't support for `g` flag, use `matchAll` argument to get all matches, i.e. `'abcabc'.match(/ab/, true)` (jora) instead of `'abcabc'.match(/ab/g)` (JS)
reduce(fn\[, initValue]) | The same as `Array#reduce()` in JS. Use `$$` to access to accumulator and `$` to current value, e.g. find the max value `reduce(=>$ > $$ ? $ : $$)`

## License

MIT
