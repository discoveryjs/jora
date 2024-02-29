# Jora library API

```js
import jora from 'jora';

// Create a query
const query = jora('foo.bar', { /* ...options */ });

// Perform the query
const result = query(data, context);
```

Options:

- methods

  Type: `Object<string, function | string>`  
  Default: `undefined`

  Describes additional methods for use in queries. Accepts an object where each key represents a method name, and its value can be a function or a string (jora query) defining the action (see [Custom methods and assertions](#сustom-methods-and-assertions)). Note: Overriding [built-in methods](https://discoveryjs.github.io/jora/#article:jora-syntax-methods-builtin) is not permitted and will result in an exception.

- assertions

  Type: `Object<string, function | string>`  
  Default: `undefined`

  Specifies additional assertions for use in queries. It requires an object where each key is an assertion name, and its value is either a function or a string (jora query) for the assertion (see [Custom methods and assertions](#сustom-methods-and-assertions)). Similar to methods, overriding [built-in assertions](https://discoveryjs.github.io/jora/#article:jora-syntax-assertions&!anchor=built-in-assertions) will trigger an exception.

- debug

  Type: `Boolean` or `function(name, value)`  
  Default: `false`

  Activates debug output. By default, it uses console.log(). If a function is provided, it will be used instead of console.log(), taking a section name and its value as arguments.

- tolerant

  Type: `Boolean`  
  Default: `false`

  Enables a tolerant parsing mode that attempts to suppress parsing errors when feasible.

- stat

  Type: `Boolean`  
  Default: `false`

  Turns on stat mode. In this mode, instead of returning the query results, a query statistics interface is provided.

In scenarios where custom methods or assertions are required, it is recommended to use a custom query factory. This approach allows for consistent application of custom settings across various queries.

```js
import jora from 'jora';

// Create a query factory with common settings
const createQuery = jora.setup({ /* methods, assertions */ });

// Create a query
const query = createQuery('foo.bar', { /* options as for jora() without "methods" and "assertions" */ });

// Perform the query
const result = query(data, context);
```

## Сustom methods and assertions

Queries can be augmented using the `methods` and `assertions` options, allowing for custom extensions. Both options can accept definitions as either regular functions or strings (jora queries). There are distinct considerations for each type of definition:

- **Function definitions**:

  Within the function scope, `this` refers to a special object containing a `context` reference, which in turn refers to the query's context. Methods and assertions can be invoked using `this.method(name, ...args)` and `this.assertion(name, ...methods)`, respectively. This approach allows for the integration of both built-in and custom definitions.

- **String definitions** (jora queries):

  String definitions have access to special variables such as `$`, `$$`, `@`, and `#`. Additionally, all built-in methods and assertions, along with any custom elements, are accessible within these definitions.

  > **Note**: The `@` variable pertains to the entry value of a method or an assertion definition, and not to the entry value of the query itself.

There are two methods for enhancing queries in jora:

- Using the `setup()` method for a query factory (recommended):

  This approach involves creating a custom query factory using the `setup()` method. It allows for defining methods and assertions that are reused across all queries created with this factory. This method is more efficient, especially when dealing with multiple queries.

  ```js
  import jora from 'jora';

  // Create a custom setup for queries
  const queryWithCustomMethods = jora.setup({
      methods: {
          customMethod($) { /* implement custom logic here */ }
      },
      assertions: {
          odd: '$ % 2 = 1'
      }
  });

  // Use the custom query factory
  queryWithCustomMethods('foo.customMethod(is odd)')(data, context);
  ```

- Defining extensions ad hoc on basic query factory call (less efficient):

  In this method, extensions are defined directly on the query creation call of the basic setup. It's less efficient in some cases because extensions are not reused across different queries.

  ```js
  import jora from 'jora';

  // Define extensions on a query created for basic setup
  const result = jora('foo.customMethod(is odd)', {
      methods: {
          customMethod($) { /* implement custom logic here */ }
      },
      assertions: {
          odd: '$ % 2 = 1'
      }
  })(data, context);
  ```

  > Note: Extensions configuration is not available for queries created with a query factory made using the `setup()` method. The `setup()` method is designed to create extensions that are reused across all queries.

## Query introspection

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

### Methods

- `stat(pos: number, includeEmpty?: boolean)`

    Returns an array of ranges with all the values which are passed through `pos` during performing a query.

    Output format:

    ```ts
    stat(): Array<{
        context: 'path' | 'key' | 'value' | 'in-value' | 'value-subset' | 'var' | 'assertion',
        from: number,
        to: number,
        text: string,
        values: Set<any>,
        related: Set<any> | null
    }> | null
    ```

- `suggestion(pos: number, options?)`

    Returns suggesion values grouped by a type or `null` if there is no any suggestions. The following `options` are supported (all are optional):
    - `limit` (default: `Infinity`) – a max number of the values that should be returned for each value type (`"property"`, `"value"`, `"variable"`, `"assertion"`)
    - `sort` (default: `false`) – a comparator function (should take 2 arguments and return a negative number, `0` or a positive number) for value list sorting, makes sence when `limit` is used
    - `filter` (default: `function`) – a filter function factory (`pattern => value => <expr>`) to discard values from the result when returns a falsy value (default is equivalent to `patttern => value => String(value).toLowerCase().includes(pattern)`)

    Output format:

    ```ts
    suggestion(): Array<{
        type: 'property' | 'value' | 'variable' | 'assertion',
        from: number,
        to: number,
        text: string,
        suggestions: Array<string | number>
    }> | null
    ```
