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

For a browser two bundles are available:

- `dist/jora.js`
- `dist/jora.esm.js`

You may include `jora` by one of the following way:

```html
<script src="node_modules/jora/dist/jora.js"></script>
<script type="module">
  import jora from 'node_modules/jora/dist/jora.esm.js';
</script>

<!-- or use one of CDN -->
<script src="https://cdn.jsdelivr.net/npm/jora/dist/jora.js"></script>
<script type="module">
  import jora from 'https://cdn.jsdelivr.net/npm/jora';
</script>

<script src="https://unpkg.com/jora/dist/jora.js"></script>
```

In case a non ESM version is used, a global variable `jora` will become available.

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

See [Jora library API](#article:api) for details.

## Your first query

Jora has no side effects and doesn't transform (mutate) input. Instead, it produces new data based on input. Jora query is never throw exception due to an input value or its structure, and may generate an output without input data at all.

> Note: Side effects, input mutations and exception raising may occur due to custom methods. However, it should be avoided by method's athours.

```js
jora('.foo.bar')({ a: 42 }) // undefined
jora('2 + 2')() // 4
```

