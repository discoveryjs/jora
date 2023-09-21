# Assertions

TBD

## Syntax

```jora
expr is assertion
```

> Note: `expr` can be omitted, i.e. `is assertion` is also valid form

An assertion can be an expression using `not`, `and`, `or` and grouping operators:

```
is not assertion
is (assertion and assertion)
is (assertion or not assertion)
is not (assertion and assertion)
is (assertion and (assertion or assertion))
```

## Built-in assertions

Jora comes with a set of built-in assertions which perform most common examinations on values.

Assertion | Descripton
----------|-----------
`string` | `typeof e === 'string'`
`number` | `typeof e === 'number'`
`int` | `Number.isInteger(e)`
`finite` | 
`NaN` |
`Infinity` | `e === Infinity \|\| e === -Infinity`
`boolean` | `e === true \|\| e === false`
`null` | `e === null`
`undefined` | `e === undefined`
`nullish` | `e === null \|\| e === undefined`
`object` | `e !== null && typeof e === 'object' && e.constructor === Object` 
`array` | `Array.isArray(e)`
`regexp` | `e.toString() === '[object RegExp]'`
`truthy` | [bool()](./methods-builtin.md#bool) method returns `true`
`falsy` | [bool()](./methods-builtin.md#bool) method returns `false`

## Custom assertions

To define custom assertions in Jora use the following API:

```js
import jora from 'jora';

// Setup query factory with custom methods
const createQueryWithCustomAssertions = jora.setup({
    assertions: {
        mine($) {
            /* test a value */
        }
    }
});

// Create a query
const queryWithMyAssertion = createQueryWithCustomAssertions('is mine');
```
