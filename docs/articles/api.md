# Jora library API

## Enhancing queries with custom methods and assertions

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
