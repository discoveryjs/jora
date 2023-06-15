# Bracket Notation

Bracket notation enables convenient access to object properties and array elements. Bracket notation is especially useful when the property name is stored in a variable, computed dynamically, or when accessing array elements using indices. Jora supports bracket notation, similar to JavaScript, by enclosing the property name or index within square brackets (`[]`). You can also use bracket notation for the current value by using `$['name']`.

```jora
person['name'] // Accesses the `name` property of the `person` object
```

```jora
items[0] // Accesses the first element of the `items` array
```

## Optional chaining

In Jora, optional chaining is enabled by default for both [dot](./dot-notation.md) and bracket notations, meaning there is no special syntax required for optional chaining. This built-in functionality allows for more concise and error-free code when accessing properties or elements that may not exist.

Property access syntax in Jora is used for element access in arrays or characters in strings, making it versatile and consistent across different data types.

## Using functions with bracket notation

When a function is used with bracket notation, the notation returns the first value or element for which the function returns a truthy value. The context of a function varies depending on the data type:

- For arrays and strings: `$` – current element/char, `$$` – index
- For objects: `$` – value of entry, `$$` – key of entry

Consider the following example:

```jora
$items: [
    { id: 1, name: 'Foo' },
    { id: 2, name: 'Bar' },
    { id: 3, name: 'Baz' }
];

$items[=> id = 2] // Returns { id: 2, name: 'Bar' }
```

In this example, the function used with bracket notation returns the first object in the `$items` array with an `id` property equal to 2.

Next query uses bracket notation to find the first object within `$items` that meets two conditions: the property key (entry key) matches the regular expression `/^item/` and `price` property of the object (entry value) must be greater than or equal to 20.

```jora
$items: {
    item1: { id: 1, name: 'First Item', price: 10 },
    item2: { id: 2, name: 'Second Item', price: 20 },
    item3: { id: 3, name: 'Third Item', price: 30 }
};

$items[=> $$ ~= /^item/ and price >= 20] // Returns { id: 2, name: 'Second Item', price: 20 }
```

## Negative indexing

Jora supports negative indexing for arrays and strings, allowing you to access elements from the end of the array or string by specifying a negative index.

```jora
[1, 2, 3, 4, 5][-2] // Returns 4
```

In the example above, the negative index `-2` accesses the second-to-last element in the array, which is the number 4.

## Examples

### Computed property access

```jora
$prop: 'name';
person[$prop] // Accesses the `name` property of the `person` object
```

### Accessing elements in a nested array

```jora
$matrix: [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
];

$matrix[1][2] // Returns 6
```

### Accessing characters in a string

```jora
$text: 'Jora';
$text[2] // Returns 'r'
```

### Find the first element in an array that meets multiple criteria

```jora
$items: [
    { category: 'A', value: 5 },
    { category: 'B', value: 10 },
    { category: 'A', value: 15 },
    { category: 'C', value: 20 },
    { category: 'A', value: 25 }
];

$items[=> category = 'A' and value >= 20] // Returns { category: 'A', value: 25 }
```
