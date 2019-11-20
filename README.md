# Jora

[![NPM version](https://img.shields.io/npm/v/jora.svg)](https://www.npmjs.com/package/jora)
[![Build Status](https://travis-ci.org/discoveryjs/jora.svg?branch=master)](https://travis-ci.org/discoveryjs/jora)
[![Coverage Status](https://coveralls.io/repos/github/discoveryjs/jora/badge.svg?branch=master)](https://coveralls.io/github/discoveryjs/jora?branch=master)

JavaScript object query engine

> STATUS: A proof of concept. Syntax may change in next releases.

Features:

- Tolerant to data stucture queries (e.g. just returns *nothing* for paths that not reachable)
- Compact syntax for common tasks
- Aggregate values across arrays and eliminate duplicates by default
- Stat collecting mode (powers suggestions)
- Tolerant parsing mode (useful to provide suggestions on a query editing in an editor)
- Extensible DSL by providing a additional method list on query build
ntl

Related projects:

- [jora-cli](https://github.com/discoveryjs/jora-cli) – Command line interface for Jora
- [Jora sandbox](https://discoveryjs.github.io/jora-sandbox/) – A Web interface where you can play with jora syntax or transform some JSON with zero setup
- [Discovery](https://github.com/discoveryjs/discovery) – Hackable JSON discovery tool. Uses jora to query a data for views
- [JsonDiscovery](https://github.com/discoveryjs/browser-extension-json-discovery) – a browser’s extension for viewing JSON built on Discovery, available for [Chrome](https://chrome.google.com/webstore/detail/jsondiscovery/pamhglogfolfbmlpnenhpeholpnlcclo) and [Firefox](https://addons.mozilla.org/en-GB/firefox/addon/jsondiscovery/) (read more in the article [Changing a way we’re viewing JSON in a browser](https://medium.com/@rdvornov/changing-a-way-were-viewing-json-in-a-browser-51eda9103fa2))

TODO:

- [ ] AST
- [ ] Immutable paths hoisting (reduce computations -> performance)
- [ ] Smart computation caching across queries
- [ ] Query parts performance stat
- [ ] Query transforming, e.g. query merge, subquery to a query, context inlining
- [ ] Method namespaces, e.g. semver, path, math etc
- [ ] Syntax highlighting
- [ ] Prettifier
- [ ] Move jison to dev dependencies
- [ ] Debugging (step by step evaluation)
- [ ] Prediction a shape of data suitable for a query (touching pathes)

Table of content:

<!-- TOC depthFrom:2 -->

- [Install](#install)
- [API](#api)
- [Quick demo](#quick-demo)
- [Syntax](#syntax)
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

## API

```js
const jora = require('jora');

// create a query
const query = jora('foo.bar') ;
// or with custom methods
const queryWithCustomMethods = jora('foo.myMethod()', {
    methods: {
        myMethod(current) { /* do something and return a new value */ }
    }
});

// perform a query
const result = query(data, context);
```

Options:

- methods

  Type: `Object`  
  Default: `undefined`

  Additional methods for using in query passed as an object, where a key is a method name and a value is a function to perform an action. It can override build-in methods.

- debug

  Type: `Boolean`  
  Default: `false`

  Enables debug output.

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
    const multipleVersionPackages = jora(`
        ..(dependencies.mapToArray("name"))
        .group(<name>, <version>)
        .({ name: key, versions: value })
        [versions.size() > 1]
    `)(npmTree);

    const depsPathsToMultipleVersionPackages = jora(`
        .({
            name,
            version,
            otherVersions: #[name=@.name].versions - version,
            dependencies: dependencies
                .mapToArray("name")
                .map(::self)
                [name in #.name or dependencies]
        })
    `)(npmTree, multipleVersionPackages);

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

### Primitives

Jora | Description
--- | ---
42<br>-123<br>4.22<br>1e3<br>1e-2 | Numbers
"string"<br>'string' | Strings
/regexp/<br>/regexp/i | A JavaScript regexp, only `i` flag supported
{ } | Object initializer/literal syntax. You can use spread operator `...`, e.g. `{ a: 1, ..., ...foo, ...bar }` (`...` with no expression on right side the same as `...$`)
[ ] | Array initializer/literal syntax
< block ><br>=> e | A function<br>NOTE: Syntax will be changed
query asc<br>query desc<br>query asc, query desc, ... | A sorting function that takes two arguments and compare query result for each in specified order (`asc` – ascending, `desc` – descending)

### Keywords

Following keywords can be used as in JavaScript:

- `true`
- `false`
- `null`
- `undefined`

### Operators

Jora | Description
--- | ---
x + y | Add<br>In case one of the operands is an array it produces new array with elements from `x` and `y` excluding duplicates
x - y | Subtract<br>In case one of the operands is an array with elements from `x` excluding elements from `y`
x * y | Multiply
x / y | Divide
x % y | Modulo

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

Some constructions suppose to use a block, which may consists of a definition list (should comes first) and an expression. Both are optional. When an expression is empty, a current value (i.e. `$`) returns.

The syntax of definition (white spaces between any part are optional):

```
$ SYMBOL ;
$ SYMBOL : expression ;
```

For example:

```
$foo:123;          // Define `$foo`
$bar;              // The same as `$bar:$.bar;` or `$a:bar;`
$baz: $foo + $bar; // Definitions may be used in following expressions
```

In terms of JavaScript, a block creates a new scope. Variables can't be redefined or change a value in the same or nested scopes, otherwise it cause to error.

### Special references

Jora | Description
--- | ---
$ | A scope input data (current value). On top level scope it's the same as `@`. In most cases it may be omitted. Used implicitly an input for subquery when no other subjects is defined (e.g. `foo()` and `.foo()` are equivalent for `$.foo()`).
@ | A query input data
\# | A query context

Since Jora's query performs as `query(data, context)`, in terms of Jora it looks like `query(@, #)`.

### Path chaining

jora | Description
--- | ---
SYMBOL | The same as `$.SYMBOL`
.SYMBOL | Child member operator (example: `foo.bar.baz`, `#.foo['use any symbols for name']`)
..SYMBOL<br> ..( block ) | Recursive descendant operator (example: `..deps`, `..(deps + dependants)`)
.[ block ] | Filter a current data. Equivalent to a `.filter(<block>)`
.( block ) | Map a current data. Equivalent to a `.map(<block>)`
.method()<br> ..method() | Invoke a method to current data, or each element of current data if it is an array
path[e] | Array-like notation to access properties. It works like in JS for everything with exception for arrays, where it equivalents to `array.map(e => e[key])`. Use `pick()` method to get an element by index in array.

### Build-in methods

jora | Description
--- | ---
bool() | The same as `Boolean()` in JS, with exception that *empty arrays* and *objects with no keys* treats as falsy
keys() | The same as `Object.keys()` in JS
values() | The same as `Object.values()` in JS
entries() | The same as `Object.entries()` in JS
mapToArray("key"[, "value"]) | Converts an object to an array, and store object key as "key"
pick("key")<br>pick(fn) | Get a value by a key, an index or a function. Useful for arrays, e.g. since `array[5]` applies `[5]` for each element in an array (equivalent to `array.map(e => e[5])`), `array.pick(5)` should be used instead.
size() | Returns count of keys if current data is object, otherwise returns `length` value or `0` when field is absent
sort(\<fn>) | Sort an array by a value fetched with getter (`<fn>`). Keep in mind, you can use sorting function definition syntax using `asc` and `desc` keywords, qhich is more effective in many ways. In case of sorting function definition usage, `<` and `>` are not needed and you can specify sorting order for each component. Following queries are equivalents:<br>`sort(<foo.bar>)` and `sort(foo.bar asc)`<br>`sort(<foo>).reverse()` and `sort(foo desc)`<br>`sort(<[a, b]>)` and `sort(a asc, b asc)`
reverse() | Reverse order of items
group(\<fn>[, \<fn>]) | Group an array items by a value fetched with first getter.
filter(\<fn>) | The same as `Array#filter()` in JS
map(\<fn>) | The same as `Array#map()` in JS

## License

MIT
