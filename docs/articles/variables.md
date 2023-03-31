## Variables

Jora allows defining and using variables within queries. A value can be assigned to a variable only on its definition. Once a variable is defined, its value cannot be changed throughout the query. Variables are useful for storing intermediate results, improving readability, reusing expressions and preserving values across scopes.

- [Syntax and basic usage](#syntax-and-basic-usage)
- [Special variables](#special-variables)
- [Scopes](#scopes)
- [Preserving values across scopes](#preserving-values-across-scopes)
- [Reserved names](#reserved-names)

## Syntax and basic usage

There are two main forms for defining variables:

1. `$ident: expression;` - Define a variable and assign the result of an expression to it.
2. `$ident;` - Shorthand for defining a variable with a value equal to the property with the same name as the variable.

Here's an example of defining and using variables in various ways:

```jora
$foo: 123;          // Define `$foo` variable
$bar;               // Shorthand for `$bar: bar;`
$baz: $foo + $bar;  // Definitions may be used in following expressions
```

In the following example, we define two variables: `$multiplier` and `$array`. Then, we use the `$multiplier` variable with `.()` ([mapping](./map.md)) to multiply each element of the `$array` array.

```jora
$multiplier: 2;
$array: [1, 2, 3];

$array.($ * $multiplier) // Result: [2, 4, 6]
```

## Special variables

Jora has several special variables that serve specific purposes:

- `@`: Represents the current value of the input data.
- `#`: Represents the context provided to the query.
- `$`: Represents the current value within a subquery or method. When used in a function, it represents the first parameter.
- `$$`: Represents the second parameter of a function.

Input data and context are provided when executing a query: `query(inputData, context)`.

Examples of using `$` and `$$` in functions:

```jora
$fn: => { a: $, b: $$ };

'hello'.$fn('world') // result: { a: 'hello', b: 'world' }
```

> See also [Methods](./methods.md) article on details of methods usage

## Scopes

Scopes are created by certain constructions in Jora. Variables defined within a scope are only accessible within that scope and its nested scopes.

Constructions that allow defining variables include:

1. Top-level of a query:

```jora
$foo: 'bar';

$foo // Result: 'bar'
```

2. [Mapping `.(...)`](./map.md):

```jora
{
  a: 10,
  b: 20
}.($a; $b; $a + $b) // Result: 30
```

3. [Filter `.[]`](./filter.md):

```jora
[1, 2, 3].[$num: $; $num * 2] // Result: [2, 4, 6]
```

4. Parentheses `(...)`:

```jora
($a: 5; $b: 10; $a + $b) // Result: 15
```

5. Object literal `{...}`:

```jora
{
  $a: 3;
  $b: 4;
  c: $a * $b
} // Result: { c: 12 }
```

6. [Pipeline operator `|`](./pipeline-operator.md):

```jora
[1, 2, 3] | $size: size(); .($ * $size) // Result: [3, 6, 9]
```

## Preserving values across scopes

Variables in Jora can also be helpful for storing the current value (`$`) or its nested data before entering a nested scope, as `$` might change within the nested scope. Storing the current value or its parts in a variable before entering the nested scope ensures that you can still access the original value or its parts in the new scope. Here are a couple of examples demonstrating this use case:

```jora
user.({
    $username: name;
    $email; // The same as `$email: email;`

    ...,
    signedPost: posts.({
        author: $username,
        authorEmail: $email,
        title
    })
)}
```

In this example, we store the `name` and `email` properties of the current user in variables `$username` and `$email`. This allows us to access these values within the nested scope created by the `.()` operation on the `posts` property, even though `$` has changed to represent the current post.


```jora
$items: [
    { value: 1, children: [2, 3] },
    { value: 2, children: [4, 5] },
    { value: 3, children: [6, 7] }
];

$items.(
    $item: $;

    children.({
        parent: $item.value,
        child: $
    })
)
// Result:
// [{ parent: 1, child: 2 }, { parent: 1, child: 3 }, { parent: 2, child: 4 }, ...]
```

In this example, we store the entire current item in the variable `$item` before entering the nested scope created by the `.()` operation on the `children` property. This allows us to access the parent value within the nested scope even though `$` has changed to represent the current child.

#### Reserved names

Jora reserves some names for future special use cases. These names cannot be used as variable names to ensure compatibility with future versions:

- `data`
- `context`
- `ctx`
- `array`
- `idx`
- `index`