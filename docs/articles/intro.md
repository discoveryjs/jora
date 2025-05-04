# Introduction to Jora language

Jora is a powerful and expressive query language designed for querying and transforming JavaScript-like data or JSON data. It's a superset of JSON5, which means it supports all JSON5 syntax and adds additional features, making it even more versatile. Jora shares many similarities with JavaScript, providing a familiar environment for developers. Its core principles are simplicity, readability, flexibility, and performance, which make it easy to learn and use for a wide range of data processing tasks.

## Core principles

- **Concise syntax**

  Jora aims to provide a readable and concise syntax, which allows you to write complex queries with a minimal amount of code. It offers a compact syntax for common tasks, reducing boilerplate code and improving readability.

- **Tolerant to data structure**

  Jora is tolerant to data structure, meaning it doesn't fail on paths that don't exist and instead returns nothing. In other words, if there are no parse or compile errors for a query, it can be applied without errors to any data, and no exceptions will be raised (although the result might be incorrect). This makes it a robust language for handling various data structures.

- **Aggregates and eliminates duplicates**

  Jora automatically aggregates values across arrays and eliminates duplicates by default. This simplifies data queries and reduces the need for additional processing steps to handle duplicate values.

- **Immutability**

  Jora is an immutable language, which means it does not modify the original data. Instead, it creates new data based on the input. This ensures data consistency and reduces the risk of accidental data corruption.

- **Flexibility**

  Jora offers a variety of built-in methods and functions, allowing you to easily process and manipulate data to meet your specific needs. Additionally, you can extend Jora with custom methods and functions, further enhancing its capabilities.

- **Performance**

  Jora is designed to be fast and efficient, ensuring that even large and complex data sets can be processed quickly and without significant performance overhead.

## Jora syntax basics

Jora's syntax is designed to be both expressive and concise, allowing to easily perform complex data manipulation tasks. The similarities with JavaScript and JSON5 make Jora a natural choice for developers familiar with those languages, and its performance characteristics ensure it remains a powerful tool for data processing.

Here are some basic examples to help you get started:

- Accessing properties using [bracket](./bracket-notation.md) and [dot](./dot-notation.md) notations: 

  ```jora
  posts[0].title
  ```

- [Filtering](./filter.md) arrays:

  ```jora
  users.[age > 30]
  ```

- [Mapping](./map.md) arrays:

  ```jora
  users.(name.first + ' ' + name.last)
  ```

- [Methods](./methods.md) and [functions](./functions.md):

  ```jora
  users.sort(name asc).group(=> name)
  ```

- [Variables](./variables.md) and [pipeline operator](./operators.md#pipeline-operator):

  ```jora
  $oldestUser: users.max(=> age);
  $oldestUser | { name, age }
  ```

See [Syntax overview](./syntax-overview.md) for a comprehensive overview of Jora syntax.
