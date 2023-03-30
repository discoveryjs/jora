# Introduction to Jora language

Jora is a powerful and expressive query language designed for querying and transforming JSON data. It's a superset of JSON5, which means it supports all JSON5 syntax and adds additional features, making it even more versatile. Jora shares many similarities with JavaScript, providing a familiar environment for developers. Its core principles are simplicity, readability, flexibility, and performance, which make it easy to learn and use for a wide range of data processing tasks.

## Core principles

- **Immutability**

  Jora is an immutable language, which means it does not modify the original data. Instead, it creates new data based on the input. This ensures data consistency and reduces the risk of accidental data corruption.

- **Concise syntax**

  Jora aims to provide a readable and concise syntax, which allows you to write complex queries with a minimal amount of code. It offers a compact syntax for common tasks, reducing boilerplate code and improving readability.

- **Flexibility**

  Jora offers a variety of built-in methods and functions, allowing you to easily process and manipulate data to meet your specific needs. Additionally, you can extend Jora with custom methods and functions, further enhancing its capabilities.

- **Performance**

  Jora is designed to be fast and efficient, ensuring that even large and complex data sets can be processed quickly and without significant performance overhead.

- **Tolerant to data structure**

  Jora is tolerant to data structure, meaning it doesn't fail on paths that don't exist and instead returns nothing. In other words, if there are no parse or compile errors for a query, it can be applied without errors to any data, and no exceptions will be raised (although the result might be incorrect). This makes it a robust language for handling various data structures.

- **Aggregates and eliminates duplicates**

  Jora automatically aggregates values across arrays and eliminates duplicates by default. This simplifies data queries and reduces the need for additional processing steps to handle duplicate values.

### Aggregates and eliminates duplicates
Jora automatically aggregates values across arrays and eliminates duplicates by default. This simplifies data queries and reduces the need for additional processing steps to handle duplicate values.

## Syntax basics

Jora's syntax is designed to be simple and easy to understand. Here are some basic examples to help you get started:

1. Accessing properties: 

```jora
posts.title
```

2. [Filtering](./filter.md) arrays:

```jora
users.[age > 30]
```

3. [Mapping](./map.md) arrays:

```jora
users.(name.first + ' ' + name.last)
```

4. [Variables](./variables.md) and expressions:

```jora
$oldestUser: users.sort(age desc)[0];
$oldestUser.name
```

5. Chaining methods and functions:

```jora
users.[age > 30].(name.first).reverse().join(', ')
```

As you can see, Jora's syntax is designed to be both expressive and concise, allowing you to easily perform complex data manipulation tasks. The similarities with JavaScript and JSON5 make Jora a natural choice for developers familiar with those languages, and its performance characteristics ensure it remains a powerful tool for data processing.
