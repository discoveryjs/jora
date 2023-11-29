# Operators

Jora offers a variety of operators to perform operations, comparisons, and boolean logic on data.

- [Arithmetic operators](#arithmetic-operators)
- [Comparison operators](#comparison-operators)
- [Logical operators](#logical-operators)
- [Ternary operator](#ternary-operator)
- [Grouping operator](#grouping-operator)
- [Pipeline operator](#pipeline-operator)
- [Operator precedence](#operator-precedence)

## Arithmetic operators

| Jora | Description |
|------|-------------|
| `x + y` | Add. In case one of the operands is an array, it produces a new array with elements from `x` and `y`, excluding duplicates
| `x - y` | Subtract. In case left operand is an array, it produces a new array with elements from `x`, excluding elements from `y`
| `x * y` | Multiply
| `x / y` | Divide
| `x % y` | Modulo

```jora
// Add numbers
1 + 2 // 3

// Add arrays
[1, 2, 3] + [2, 3, 4] // [1, 2, 3, 4]

// Subtract numbers
10 - 5 // 5

// Subtract arrays
[1, 2, 3] - [2, 3] // [1]

// Subtract from array
[1, 2, 3] - 2 // [1, 3]

// Multiply numbers
2 * 3 // 6

// Divide numbers
10 / 2 // 5

// Modulo
7 % 3 // 1
```

## Comparison operators

| Jora | Description |
|------|-------------|
| `x = y`  | Equals (as `Object.is(x, y)` in JavaScript)
| `x != y` | Not equals (as `!Object.is(x, y)` in JavaScript)
| `x < y`  | Less than
| `x <= y` | Less than or equal to
| `x > y`  | Greater than
| `x >= y` | Greater than or equal to
| `x ~= y` | Match operator. Behavior depends on `y` type:<br>- RegExp – test against regexp<br>- function – test like `filter()`<br>- `null` or `undefined` – always truthy<br>- anything else – always falsy

```jora
// Equals
1 = 1 // true
'a' = 'b' // false

// Not equals
1 != 2 // true
'a' != 'a' // false

// Less than
1 < 2 // true
2 < 1 // false

// Less than or equal to
1 <= 1 // true
2 <= 1 // false

// Greater than
2 > 1 // true
1 > 2 // false

// Greater than or equal to
2 >= 2 // true
1 >= 2 // false

// Match operator
'hello' ~= /l+/ // true
'world' ~= => size() > 3 // true
'foo' ~= null // true
'bar' ~= 123 // false
```

## Logical operators

| Jora | Description |
|------|-------------|
| `x or y` | Logical OR. Equivalent to `\|\|` in JavaScript, but `x` is testing for truthy with the [bool()](./methods-builtin.md#bool) method
| `x and y` | Logical AND. Equivalent to `&&` in JavaScript, but `x` is testing for truthy with the [bool()](./methods-builtin.md#bool) method
| `not x`<br>`no x` | Logical NOT. Equivalent to `!` in JavaScript, but `x` is testing for truthy with the [bool()](./methods-builtin.md#bool) method
| `x ?? y` | The [nullish coalescing](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/
Nullish_coalescing), equivalent to `??` in JavaScript
| `x is assertion` | Tests a value against an assertion, see [Assertions](./assertions.md)
| `x in [a, b, c]`<br>`[a, b, c] has x` | Equivalent to `x = a or x = b or x = c`
| `x not in [a, b, c]`<br>`[a, b, c] has no x` | Equivalent to `x != a and x != b and x != c`


```jora
// Logical OR
true or false   // true
[] or false     // false
[1, 2] or false // [1, 2]

// Logical AND
true and false  // false
true and true   // true
{} and "ok"     // {}

// Logical NOT
not true // false
no false // true
not []   // true
not [1]  // false

// Nullish coalescing
null ?? 1      // 1
undefined ?? 1 // 1
false ?? 1     // false
1234 ?? 1      // 1234

// IS operator
[] is array    // true
[] is number   // false
{} is (boolean or string) // false

// IN operator
1 in [1, 2, 3] // true
4 in [1, 2, 3] // false

// HAS operator
[1, 2, 3] has 1 // true
[1, 2, 3] has 4 // false

// NOT IN operator
1 not in [1, 2, 3] // false
4 not in [1, 2, 3] // true

// HAS NO operator
[1, 2, 3] has no 1 // false
[1, 2, 3] has no 4 // true
```

## Ternary Operator

The ternary operator requires three operands: a condition, followed by a question mark (`?`), an expression for a truthy condition, a colon (`:`), and an expression for a falsy condition. The condition is evaluated using the [bool()](./methods-builtin.md#bool) method.

```jora
true ? 'yes' : 'no'  // Result: 'yes'
```
```
false ? 'yes' : 'no' // Result: 'no'
```

Operands can be omitted. When omitted, `$` is used as a default for the condition and the truthy expression, and `undefined` for the falsy expression.

```jora
?: // Equivalents to `$ ? $ : undefined`
```

A query to truncate strings in array longer than 10 characters: 

```jora
['short', 'and a very long string']
.(size() < 10 ?: `${slice(0, 10)}...`)
// Result: ["short", "and a very..."]
```

If the falsy operand is omitted, the colon (`:`) can also be omitted. This is useful in conjunction with [assertions](./assertions.md) and statistical or mathematical methods:

```jora
numbers.sum(=> is number ? $ * $)
```

## Grouping operator

Parentheses `( )` serve as the grouping operator, allowing explicitly define the order in which operations should be executed, ensuring that specific calculations are performed before others. This is particularly useful when dealing with complex expressions, as it helps to avoid unexpected results due to the default operator precedence.

```jora
(1 + 2) * (3 + 4)
// Result: 21
```

In this case, the addition operations are performed first, followed by the multiplication, resulting in the correct output of 21. Without the parentheses, the expression would be calculated as `1 + (2 * 3) + 4`, giving a different result of 11.

[Variable declarations](./variables.md) are allowed within the parentheses:

```jora
($a: 1; $a + $a)
// Result: 2
```

## Pipeline operator

The pipeline operator `|` facilitates the simplification of queries by linking expressions in a chain. Its utility is especially evident when treating a query result as a scalar value or reusing the outcome of an extensive or resource-intensive subquery multiple times, without the need for storage in a variable. When using the pipeline operator, the value of `$` on the right side of the operator becomes equal to the value of the left side.

```jora
1.5 | floor() + ceil()
// Result: 3
```

The following examples demostrate how a query can be simplified using the pipeline operator:

- Replacement for grouping operator:

    ```jora
    (a + b).round()
    ```
    ```jora
    a + b | round()
    ```

- Simplify expressions to avoid using the [mapping](./map.md):

    ```jora
    { foo: 1, bar: 2, baz: 3 }.(foo + bar + baz)
    // Result: 6
    ```
    ```jora
    { foo: 1, bar: 2, baz: 3 } | foo + bar + baz
    // Result: 6
    ```

- Reducing repetitions:

    ```jora
    $a.bar + $a.baz
    ```
    ```jora
    $a | bar + baz
    ```

- Reusing result of a long or expensive subquery without saving it into a [variable](./variables.md):

    ```jora
    $result: very.expensive.query;
    $result ? $result.sum() / $result.size() : '–'
    ```
    ```jora
    very.expensive.query | $ ? sum() / size() : '–'
    ```

The pipeline operator can be used in any place of query where any other operator is applicable as well as any number of pipeline operators can be used in sequence:

```jora
.({
    $bar: num | floor() + ceil() | $ / 2;

    foo: $bar | a + b,
    baz: [1, $qux.min() | [$, $]]
})
```

[Variable declarations](./variables.md) are allowed in the beginning of the right side of the pipeline operator:

```jora
{ a: 10, b: [2, 3, 4] } | $k: a; b.($ * $k)
// Result: [20, 30, 40]
```

Any two independent syntactically correct queries can be joined with the pipeline operator, resulting in a syntactically correct query. But keep in mind that both queries will refer to the same variables `@` (query input) and `#` (query context), which may not work in all cases.

## Operator precedence

The following table shows the operators' precedence from lowest to highest:

| Precedence | Operator |
|-----:|---|
| (lowest) 1 | `,`
| 2 | `\|`
| 3 | `?:`
| 4 | `is`
| 5 | `or`
| 6 | `and`
| 7 | `??`
| 8 | `not` `no`
| 9 | `in` `not in` `has` `has no`
| 10 | `=` `!=` `~=`
| 11 | `<` `<=` `>` `>=`
| 12 | `+` `-`
| 13 | `*` `/` `%`
| (highest) 14 | `( … )`
