# Jora

[![NPM version](https://img.shields.io/npm/v/jora.svg)](https://www.npmjs.com/package/jora)
[![Build Status](https://travis-ci.org/lahmatiy/jora.svg?branch=master)](https://travis-ci.org/lahmatiy/jora)
[![Coverage Status](https://coveralls.io/repos/github/lahmatiy/jora/badge.svg?branch=master)](https://coveralls.io/github/lahmatiy/jora?branch=master)

JavaScript object query engine

> STATUS: A proof of concept

Related projects:

- [Discovery](https://github.com/discoveryjs/discovery) – Hackable JSON discovery tool. Uses jora to query a data for views
- [JsonDiscovery](https://github.com/discoveryjs/browser-extension-json-discovery) – Chrome extension built on Discovery which allows you to discover a JSON documents and make beautiful reports on the fly

Table of content:

<!-- TOC depthFrom:2 -->

- [Install](#install)
- [API](#api)
- [Quick demo](#quick-demo)
- [Syntax](#syntax)
    - [Primitives](#primitives)
    - [Keywords](#keywords)
    - [Comparisons](#comparisons)
    - [Boolean logic](#boolean-logic)
    - [Operators](#operators)
    - [Block, scope and variables](#block-scope-and-variables)
    - [Special variables](#special-variables)
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
42<br>4.222<br>-12.34e56 | Numbers
"string"<br>'string' | Strings
/regexp/<br>/regexp/i | A JavaScript regexp, only `i` flag supported
{ } | Object initializer/literal syntax. You can use spread operator `...`, e.g. `{ a: 1, ..., ...foo, ...bar }` (`...` with no expression on right side the same as `...$`)
[ ] | Array initializer/literal syntax
< block > | A function<br>NOTE: Syntax will be changed

### Keywords

The follow keyword can be used as in JavaScript:

- `true`
- `false`
- `null`
- `undefined`

### Comparisons

Jora | Description
--- | ---
x = y | Equals (as `===` in JS)
x != y | Not equals (as `!==` in JS)
x < y | Less than
x <= y | Less than or equal to
x > y | Greater than
x >= y | Greater than or equal to
x ~= y | Regular expression match
x in [a, b, c] | Equivalent to `x === a or x === b or x === c`
x not in [a, b, c] | Equivalent to `x !== a and x !== b and x !== c`

### Boolean logic

Jora | Description
--- | ---
x or y | Boolean or (as `\|\|` in JS)
x and y | Boolean and (as `&&` in JS)
not x | Boolean not (a `!` in JS)
x ? y : z | If `x` is truthy than return `y` else return `z`
( x ) | Explicity operator precedence

### Operators

Jora | Description
--- | ---
x + y | Add
x - y | Subtract
x * y | Multiply
x / y | Divide
x % y | Modulo

### Block, scope and variables

A block contains of a definition list (should comes first) and an expression. Both are optional. When an expression is empty a current value (i.e. `$`) returns.

The syntax of definition (white spaces between any part are optional):

```
$ SYMBOL ;
$ SYMBOL : expression ;
```

For example:

```
$foo:123;          // Define `$foo` variable
$bar;              // The same as `$bar:$.bar;` or `$a:bar;`
$baz: $foo + $bar; // Variables can be used inside an expression after its definition 
```

A block creates a new scope. Variables can't be redefined in the same and nested scopes, otherwise it cause to error.

### Special variables

Jora | Description
--- | ---
@ | The root data object
$ | The current data object, depends on scope
\# | The context

### Path chaining

jora | Description
--- | ---
SYMBOL | The same as `$.SYMBOL`
.SYMBOL | Child member operator (example: `foo.bar.baz`, `#.foo['use any symbols for name']`)
..SYMBOL<br> ..( block ) | Recursive descendant operator (example: `..deps`, `..(deps + dependants)`)
.[ block ] | Filter a current data. Equivalent to a `.filter(<block>)`
.( block ) | Map a current data. Equivalent to a `.map(<block>)`
.method() | Invoke a method to current data, or each element of current data if it is an array
path[e] | Array-like notation to access properties. It works like in JS for everything with exception for arrays, where it equivalents to `array.map(e => e[key])`. Use `pick()` method to get an element by index in array.

### Build-in methods

jora | Description
--- | ---
bool() | The same as `Boolean()` in JS, with exception that empty arrays and objects with no keys treats as false
keys() | The same as `Object.keys()` in JS
values() | The same as `Object.values()` in JS
entries() | The same as `Object.entries()` in JS
mapToArray("key"[, "value"]) | Converts an object to an array, and store object key as "key"
pick("key")<br>pick(fn) | Get a value by a key, an index or a function. Useful for arrays, e.g. since `array[5]` applies `[5]` for each element in an array (equivalent to `array.map(e => e[5])`), `array.pick(5)` should be used instead.
size() | Returns count of keys if current data is object, otherwise returns `length` value or `0` when field is absent
sort(\<fn>) | Sort an array by a value fetched with getter
reverse() | Reverse order of items
group(\<fn>[, \<fn>]) | Group an array items by a value fetched with first getter.
filter(\<fn>) | The same as `Array#filter()` in JS
map(\<fn>) | The same as `Array#map()` in JS

## License

MIT
