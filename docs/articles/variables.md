# Variables

Jora allows defining and using variables within queries. A value can be assigned to a variable only on its definition. Once a variable is defined, its value cannot be changed throughout the query. Variables are useful for storing intermediate results, improving readability, reusing expressions and preserving values across scopes.

- [Syntax](#syntax)
- [Special variables](#special-variables)
- [Scopes](#scopes)
- [Preserving values across scopes](#preserving-values-across-scopes)
- [Reserved names](#reserved-names)

## Syntax

There are two main forms for defining variables:

1. `$ident: expression;` – define a variable and assign the result of an expression to it.
2. `$ident;` – shorthand for defining a variable with a value equal to the property with the same name as the variable.

An example of defining and using variables in various ways:

```jora
$foo: 123;          // Define `$foo` variable
$bar;               // Shorthand for `$bar: bar;`
$baz: $foo + $bar;  // Definitions may be used in following expressions
```

In the following example, two variables are defining: `$numbers` and `$multiplier`. Then, the `$multiplier` is used within [mapping](./map.md) to multiply each element of the `$numbers` array.

```jora
$numbers: [1, 2, 3];
$multiplier: 2;

$numbers.($ * $multiplier) // Result: [2, 4, 6]
```

## Special variables

Jora has several special variables that serve specific purposes:

- `@` – represents the query input data.
- `#` – represents the context provided to the query.
- `$` – represents the current value within a scope. When used in a function, it represents the first parameter.
- `$$` – represents the second parameter of a function.

Query input data and context are provided when executing a query: `query(inputData, context)`.

Examples of using `$` and `$$` in functions:

```jora
$fn: => { a: $, b: $$ };

'hello'.$fn('world') // result: { a: 'hello', b: 'world' }
```

> See [Methods](./methods.md) on details of methods usage

## Scopes

Scopes are created by certain constructions in Jora. Variables defined within a scope are only accessible within that scope and its nested scopes.

Constructions that allow defining variables include:

1. Top-level of a query:

    ```jora
    $foo: 'bar';
    $foo
    // Result: 'bar'
    ```

1. [Mapping](./map.md) `.(…)`:

    ```jora
    {
    a: 10,
    b: 20
    }.($a; $b; $a + $b)
    // Result: 30
    ```

1. [Filtering](./filter.md) `.[]`:

    ```jora
    [1, 2, 3].[$num: $; $num % 2]
    // Result: [1, 3]
    ```

1. [Grouping operator](./operators.md#grouping-operator) `(…)`:

    ```jora
    ($a: 5; $b: 10; $a + $b)
    // Result: 15
    ```

1. [Object literal](./object-literal.md) `{…}`:

    ```jora
    {
    $a: 3;
    $b: 4;
    c: $a * $b
    }
    // Result: { c: 12 }
    ```

1. [Pipeline operator](./operators.md#pipeline-operator) `|`:

    ```jora
    [1, 2, 3] | $size: size(); .($ * $size)
    // Result: [3, 6, 9]
    ```

## Preserving values across scopes

Variables in Jora can also be helpful for storing the current value (`$`) or its nested data before entering a nested scope, as `$` might change within the nested scope. Storing the current value or its parts in a variable before entering the nested scope ensures that you can still access the original value or its parts in the new scope. Here are a couple of examples demonstrating this use case:

```jora
user.({
    $username: name;
    $email; // The same as `$email: email;`

    ...,
    signedPosts: posts.({
        author: $username,
        authorEmail: $email,
        title
    })
})
```

In this example, we store the `name` and `email` properties of the current user in variables `$username` and `$email`. This allows us to access these values within the nested scope created by the `.()` operation on the `posts` property, even though `$` has changed to represent the current post.


```jora
$items: [
    { id: 1, children: [2, 3] },
    { id: 2, children: [4, 5] },
    { id: 3, children: [6, 7] }
];

$items.(
    $item: $;

    children.({
        parent: $item.id,
        child: $
    })
)

// Result:
// [
//     { parent: 1, child: 2 },
//     { parent: 1, child: 3 },
//     { parent: 2, child: 4 },
//     { parent: 2, child: 5 },
//     { parent: 3, child: 6 },
//     { parent: 3, child: 7 }
// ]
```

In this example, we store the entire current item in the variable `$item` before entering the nested scope created by the `.()` operation on the `children` property. This allows us to access the parent value within the nested scope even though `$` has changed to represent the current child.

## Reserved names

Jora reserves some names for future special use cases. These names cannot be used as variable names to ensure compatibility with future versions:

- `data`
- `context`
- `ctx`
- `array`
- `idx`
- `index`
