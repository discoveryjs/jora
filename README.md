# Jora

[![NPM version](https://img.shields.io/npm/v/jora.svg)](https://www.npmjs.com/package/jora)
[![Build Status](https://github.com/discoveryjs/jora/actions/workflows/build.yml/badge.svg)](https://github.com/discoveryjs/jora/actions/workflows/build.yml)
[![Coverage Status](https://coveralls.io/repos/github/discoveryjs/jora/badge.svg?branch=master)](https://coveralls.io/github/discoveryjs/jora?branch=master)
[![Twitter](https://badgen.net/badge/follow/@js_discovery?icon=twitter)](https://twitter.com/js_discovery)

JavaScript object query language, and a library to process and perform Jora queries on data.

> STATUS: Jora is stable, but syntax may change in next releases. Still very much work in progress ([ideas and thoughts](https://gist.github.com/lahmatiy/d5af7a987e9548e80eae5f46e6edc931)). 

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

- [Query syntax overview](#query-syntax-overview)
    - [Comments](#comments)
    - [Expressions](#expressions)
    - [Literals](#literals)
    - [Operators](#operators)
    - [Dot, bracket and slice notations](#dot-bracket-and-slice-notations)
    - [Methods and functions](#methods-and-functions)
    - [Mapping and filtering](#mapping-and-filtering)
    - [Variables](#variables)
- [NPM package](#npm-package)
    - [Install & import](#install--import)
    - [API](#api)
    - [Quick demo](#quick-demo)

<!-- /TOC -->

## Query syntax overview

Jora is a query language designed for JSON-like data structures. It extends [JSON5](https://json5.org/) and shares many similarities with JavaScript.

See [Docs & playground](https://discoveryjs.github.io/jora/).

### Comments

```js
// single-line comment
/* multi-line
comment */
```

### Expressions

Jora expressions are the building blocks of Jora queries. Expressions can include comments, literals, operators, functions, and variables.

### Literals

Jora supports literals, which include:

- Numbers: `42`, `-3.14`, `6.022e23`
- Strings: `"hello"`, `'world'`, `\`template${yes}\``, `"\u{1F600}"`
- Booleans: `true`, `false`
- Regular expressions: `/regexp/flags`
- Object literals: `{ hello: 'world' }` (see [Object literals](https://discoveryjs.github.io/jora/#article:jora-syntax-object-literal))
- Array literals: `[1, 2, 3]` (see [Array literals](https://discoveryjs.github.io/jora/#article:jora-syntax-array-literal))
- Functions: `=> …` (see [Functions](https://discoveryjs.github.io/jora/#article:jora-syntax-functions))
- Keywords: `NaN`, `Infinity`, `null` and `undefined`
    
See [Literals](https://discoveryjs.github.io/jora/#article:jora-syntax-literals)

### Operators

Jora supports most JavaScript operators, including:

- Arithmetic: `+`, `-`, `*`, `/`, `%`
- Comparison: `=`, `!=`, `<`, `<=`, `>`, `>=`, `~=`
- Logical: `and`, `or`, `not` (alias `no`), `??`, `is`, `in`, `not in`, `has`, `has no`
- Ternary: `?:`
- Grouing: `( )`
- Pipeline: `|`

See [Operators](https://discoveryjs.github.io/jora/#article:jora-syntax-operators)

### Dot, bracket and slice notations

Jora provides notations for accessing properties and elements: dot, bracket and slice notations. Dot notation is similar to JavaScript's property access notation, using a period followed by the property name (e.g., `$.propertyName`). Bracket notation encloses the property name or index within square brackets (e.g., `$['propertyName']` or `$[0]`), it's also possible to use functions to choose. Slice notation provides a concise syntax to slice elements with optional step (`array[5:10:2]` selects each odd element from 5th to 10th indecies).

- [Dot notation](https://discoveryjs.github.io/jora/#article:jora-syntax-dot-notation)
- [Bracket notation](https://discoveryjs.github.io/jora/#article:jora-syntax-bracket-notation)
- [Slice notation](https://discoveryjs.github.io/jora/#article:jora-syntax-slice-notation)

### Methods and functions

Jora provides a rich set of built-in methods for manipulating data, such as `map()`, `filter()`, `group()`, `sort()`, `reduce()`, and many others. You can also define custom functions using the `=>` arrow function syntax, and use them as a method.

- [Functions](https://discoveryjs.github.io/jora/#article:jora-syntax-functions)
- [Methods](https://discoveryjs.github.io/jora/#article:jora-syntax-methods)
- [Built-in methods](https://discoveryjs.github.io/jora/#article:jora-syntax-methods-builtin)
- [Grouping](https://discoveryjs.github.io/jora/#article:jora-syntax-group): `group()` method
- [Sorting](https://discoveryjs.github.io/jora/#article:jora-syntax-sort): `sort()` method

### Mapping and filtering

Jora has a concise syntax for mapping and filtering. The `map(fn)` method is equivalent to `.(fn())`, while the `filter(fn)` method is equivalent to `.[fn()]`.

- [Filtering](https://discoveryjs.github.io/jora/#article:jora-syntax-filter): `.[…]` and `filter()` method
- [Mapping](https://discoveryjs.github.io/jora/#article:jora-syntax-map): `.(…)` and `map()` method
- [Recursive mapping](https://discoveryjs.github.io/jora/#article:jora-syntax-recursive-map): `..(…)`

### Variables

Variables in Jora are helpful for storing intermediate results or simplifying complex expressions. To define a variable, use the `$variableName: expression;` syntax.

See [Variables](https://discoveryjs.github.io/jora/#article:jora-syntax-variables)

## NPM package

### Install & import

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
  // ...
</script>
```

By default (for short path) a ESM version is exposing. For IIFE version a full path to a bundle should be specified. One of CDN services like `unpkg` or `jsDelivr` can be used:

- `jsDeliver`

    ```html
    <!-- ESM -->
    <script type="module">
    import jora from 'https://cdn.jsdelivr.net/npm/jora';
    </script>
    ```

    ```html
    <!-- IIFE with an export `jora` to global -->
    <script src="https://cdn.jsdelivr.net/npm/jora/dist/jora.js"></script>
    ```
- `unpkg`

    ```html
    <!-- ESM -->
    <script type="module">
    import jora from 'https://unpkg.com/jora';
    </script>
    ```

    ```html
    <!-- IIFE with an export `jora` to global -->
    <script src="https://unpkg.com/jora/dist/jora.js"></script>
    ```

### API

```js
import jora from 'jora';

// create a query
const query = jora('foo.bar');

// perform a query
const result = query(data, context);
```

See the details in [Jora library API](https://discoveryjs.github.io/jora/#article:api)

### Quick demo

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

See more examples in [Complex Jora query examples](https://discoveryjs.github.io/jora/#article:jora-syntax-complex-examples)
