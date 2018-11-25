# Jora

[![NPM version](https://img.shields.io/npm/v/jora.svg)](https://www.npmjs.com/package/jora)
[![Build Status](https://travis-ci.org/lahmatiy/jora.svg?branch=master)](https://travis-ci.org/lahmatiy/jora)
[![Coverage Status](https://coveralls.io/repos/github/lahmatiy/jora/badge.svg?branch=master)](https://coveralls.io/github/lahmatiy/jora?branch=master)

JavaScript object query engine

> STATUS: A proof of concept

## API

```js
const jora = require('jora');

// create a query
const query = jora('foo.bar') ;
// or with custom methods
const query = jora('foo.myMethod()', {
    myMethod(current) { /* do something and return a new value */ }
});

// perform a query
const result = query(data, context);
```

## Syntax

### Primitives

Jora | Description
--- | ---
42<br>4.222<br>-12.34e56 | Numbers
"string" | A string
/regexp/<br>/regexp/i | A JavaScript regexp, only `i` flag supported
{ } | Object initializer/literal syntax
( ) | Array initializer/literal syntax<br>NOTE: Syntax will be changed to `[]`
< > | A function<br>NOTE: Syntax will be changed
symbol<br>'sym \'bol!' | A sequence of chars that matches to `[a-zA-Z_][a-zA-Z_$0-9]*`, otherwise it should be wrapped into single quotes

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
x in (a, b, c) | Equivalent to `x === a or x === b or x === c`
x not in (a, b, c) | Equivalent to `x !== a and x !== b and x !== c`

### Boolean logic

Jora | Description
--- | ---
x or y | Boolean or (as `\|\|` in JS)
x and y | Boolean and (as `&&` in JS)
not x | Boolean not (a `!` in JS)
x ? y : z | If boolean x, value y, else z
( x ) | Explicity operator precedence

### Operators

jora | Description
--- | ---
x + y | Add
x - y | Subtract
x * y | Multiply
x / y | Divide
x % y | Modulo

### Queries

jora | Description
--- | ---
@ | The root data object
$ | The current data object
\# | The context
SYMBOL | The same as `$.SYMBOL`
.e | Child member operator (example: `foo.bar.baz`, `#.foo.'use any symbols for name'`)
..e | Recursive descendant operator (example: `..deps`, `..(deps + dependants)`)
.[ e ] | Filter a current data. Equivalent to a `.filter(<e>)`
.( e ) | Map a current data. Equivalent to a `.map(<e>)`
.method() | Invoke a method to current data, or each element of current data if it is an array

## Build-in methods

jora | Description
--- | ---
bool() | The same as `Boolean()` in JS, with exception that empty arrays and objects with no keys treats as false
keys() | The same as `Object.keys()` in JS
values() | The same as `Object.values()` in JS
entries() | The same as `Object.entries()` in JS
mapToArray("key"[, "value"]) | Converts an object to an array, and store object key as "key"
size() | Returns count of keys if current data is object, otherwise returns `length` value or `0` when field is absent
sort(<getter>) | Sort an array by a value fetched with getter
reverse() | Reverse order of items
group(<getter>[, <getter>]) | Group an array items by a value fetched with first getter.
filter() | The same as `Array#filter()` in JS
map() | The same as `Array#map()` in JS

## Quick demo

Get npm dependency paths (as a tree) that have packages with more than one version:

```js
const jora = require('../src');

function printTree() {
    // see implementation in examples/npm-ls.js
}

require('child_process')
    .exec('npm ls --json', (error, stdout) => {
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
│  ├─ crypto-browserify@3.12.0
│  │  ├─ browserify-cipher@1.0.1
│  │  │  ├─ browserify-aes@1.2.0
│  │  │  │  └─ inherits@2.0.3 [other versions: 2.0.1]
│  │  │  └─ browserify-des@1.0.2
│  │  │     ├─ des.js@1.0.0
│  │  │     │  └─ inherits@2.0.3 [other versions: 2.0.1]
│  │  │     └─ inherits@2.0.3 [other versions: 2.0.1]
│  │  ├─ browserify-sign@4.0.4
...
```

## License

MIT
