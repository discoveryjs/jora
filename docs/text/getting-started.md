## Install

First, download and install the `jora` with `npm`:

```
npm install jora
```

Then include it in your module:

```js
// ESM
import jora from 'jora';

// CommonJS
const jora = require('jora');
```

For a browser unminified (`dist/jora.js`) and minified (`dist/jora.min.js`) bundles are available. You may include `jora` by one of the following way:

```html
<script src="node_modules/jora/dist/jora.js"></script>
<script src="node_modules/jora/dist/jora.min.js"></script>
<!-- or use one of CDN -->
<script src="https://unpkg.com/jora/dist/jora.js"></script>
<script src="https://cdn.jsdelivr.net/npm/jora/dist/jora.js"></script>
```

In this case, global variable `jora` will become available.

## Usage

Default export of `jora` is a factory function that converts a query (string) into a function.

```js
import jora from 'jora';

typeof jora('query') // "function"
```

Such function takes a value and returns new value – a result of query performing.

```js
jora('query')(data) // query result
```

Query builder function takes `options` optional parameter:

```js
jora('query', {
    methods: undefined,
    debug: false,
    tolerant: false,
    stat: false
});
```

Options:

- methods

  Type: `Object`  
  Default: `undefined`

  > NOTE: Use `jora.setup()` (see bellow) to specify custom methods when possible, due to performance reasons.

  Custom methods for using in query passed as an object, where a key is a method name and a value is a function to perform an action. It overrides build-in methods. See [...]() for detail.

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

To create a new query factory function with predefined custom methods `jora.setup()` is using. Such factory function is not respect (ignores) `methods` option in `options`:

```js
const myQuery = jora.setup(methods);

myQuery(query)(data) // result of query
```

## Your first query

Jora has no side effects and doesn't transform (mutate) input. Instead, it produces new data based on input. Jora query is never throw exception due to an input value or its structure, and may generate an output without input data at all.

> Note: Side effects, input mutations and exception raising may occur due to custom methods. However, it should be avoided by method's athours.

```js
jora('.foo.bar')({ a: 42 }) // undefined
jora('2 + 2')() // 4
```

