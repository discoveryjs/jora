# Pipeline operator

The pipeline operator `|` in Jora facilitates the simplification of queries by linking expressions in a chain. Its utility is especially evident when treating a query result as a scalar value or reusing the outcome of an extensive or resource-intensive subquery multiple times, without the need for storage in a variable. This operator is a potent tool for code simplification and enhancement of query structure.

When using the pipeline operator, the value of `$` on the right side of the operator becomes equal to the value of the left side. This means that any two independent syntactically correct queries can be joined with the pipeline operator, resulting in a syntactically correct query.

## Syntax

```
expression | anotherExpression
```

## Usage

- [Simplifying subqueries](#simplifying-subqueries)
- [Treating query results as scalar values](#treating-query-results-as-scalar-values)
- [Simplifying expressions by avoiding mapping](#simplifying-expressions-by-avoiding-mapping)
- [Using the pipeline operator with multiple expressions](#using-the-pipeline-operator-with-multiple-expressions)
- [Reusing the result of a long or expensive subquery](#reusing-the-result-of-a-long-or-expensive-subquery)

### Simplifying subqueries

The pipeline operator can be used to simplify the process of creating subqueries. For example:

```jora
foo.bar | expression
```

This is equivalent to:

```jora
(foo.bar).expression
```

The pipeline operator produces a regular query, which means it can be used in any place where a query is applicable:

```jora
.({
    foo: $bar | a + b,
    baz: [1, $qux.size() | [$, $]]
})
```

### Treating query results as scalar values

Suppose you want to create an object from an array, like this:

```jora
[1, 2, 3] // -> { sum: ..., size: ... }
```

This problem can be solved by storing the array into a variable, but it can be more verbose and inconvenient.

```jora
$values: [1, 2, 3];
{ sum: $values.sum(), size: $values.size() }
```

Instead, the pipeline operator can help you achieve this:

```jora
[1, 2, 3] | { sum: sum(), size: size() }
```

### Simplifying expressions by avoiding mapping

The pipeline operator can also be used to simplify expressions without using the map method:

```jora
{ foo: 1, bar: 2, baz: 3 }.(foo + bar + baz)
```

Using the pipeline operator, this can be rewritten as:

```jora
{ foo: 1, bar: 2, baz: 3 } | foo + bar + baz
```

Similarly:

```jora
$a.bar + $a.baz
```

Can be rewritten as:

```jora
$a | bar + baz
```

### Using the pipeline operator with multiple expressions

You can use any number of pipeline operators in sequence:

```jora
expression1 | expression2 | expression3
```

For example:

```jora
[1, 2, 3] | sum() | { total: $ }
```

### Reusing the result of a long or expensive subquery

The pipeline operator is useful when a result of a long or expensive subquery is needed to be used twice or more times without saving it into a variable:

```jora
very.expensive.query | $ ? $.size() : '–'
```
