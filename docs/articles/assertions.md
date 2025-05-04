# Assertions

Assertions are functions used to evaluate values against specified criteria. They offer concise syntax and a dedicated context for suggestions, separate from [methods](./methods.md).

## Syntax

```jora
expr is assertion
```

> Note: Omitting `expr` is also valid, e.g., `is assertion`.

Assertions can include logical operators such as `not`, `and`, `or`, and parentheses for grouping:

```jora
is not assertion
```
```jora
is (assertion and assertion)
```
```jora
is (assertion or not assertion)
```
```jora
is not (assertion and assertion)
```
```jora
is (assertion and (assertion or assertion))
```

## Built-in assertions

Jora comes with a set of built-in assertions which perform most common examinations on values.

Assertion | JavaScript expression | Notes
----------|-----------|------
`function` | `typeof e === 'function'` | Any function
`symbol` | `typeof e === 'symbol'`
`primitive` | `e === null \|\| (typeof value !== 'object' && typeof value !== 'function')` | String, number, boolean, symbol, null or undefined
`string` | `typeof e === 'string'` | Any string
`number` | `typeof e === 'number'` | Any number, including `NaN` and `Infinity`
`int` | `Number.isInteger(e)` | Integer number (w/o implcit coercing)
`finite` | `Number.isFinite(e)` | Any number, excluding `NaN` and `Infinity`
`nan` | `Number.isNaN(e)` | Equals `NaN` (w/o implcit coercing)
`infinity` | `e === Infinity \|\| e === -Infinity`
`boolean` | `e === true \|\| e === false`
`falsy` | [bool()](./methods-builtin.md#bool) method returns `false` | JavaScript falsy values, including empty objects and arrays
`truthy` | [bool()](./methods-builtin.md#bool) method returns `true` | Everything not falsy
`null` | `e === null`
`undefined` | `e === undefined`
`nullish` | `e === null \|\| e === undefined`
`object` | `e !== null && typeof e === 'object' && e.constructor === Object` | Plain object
`array` | `Array.isArray(e)` | An array
`regexp` | `e.toString() === '[object RegExp]'`

## Query-level assertions

[Variables](./variables.md) storing functions can be used as assertions:

```jora
$odd: => $ % 2;
[1, 2, 3, 4, 5].({ num: $, odd: is $odd })
// Result: [
//     { "num": 1, "odd": true },
//     { "num": 2, "odd": false },
//     { "num": 3, "odd": true },
//     { "num": 4, "odd": false },
//     { "num": 5, "odd": true }
// ]
```

> Note: If a variable is not a function, a `$var is not a function` error will be thrown.

## Custom assertions

Jora queries can be enchanced by defining custom methods (see [Enhancing queries with custom methods and assertions](./api.md#enhancing-queries-with-custom-methods-and-assertions)):

```js
import jora from 'jora';

// Setup query factory with custom assertions
const createQueryWithCustomAssertions = jora.setup({
    assertions: {
        myAssertion($) {
            /* test a value */
        }
    }
});

// Create a query
const queryWithMyAssertion = createQueryWithCustomAssertions('is myAssertion');
```
