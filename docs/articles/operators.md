# Operators

Jora offers a variety of operators to perform operations, comparisons, and boolean logic on data.

- [Arithmetic operators](#arithmetic-operators)
- [Comparison operators](#comparison-operators)
- [Logical operators](#logical-operators)
- [Grouping operator](#grouping-operator)
- [Pipeline operator](#pipeline-operator)
- [Operator precedence](#operator-precedence)

## Arithmetic operators

| Jora | Description |
|------|-------------|
| `x + y` | Add. In case one of the operands is an array, it produces a new array with elements from `x` and `y`, excluding duplicates.
| `x - y` | Subtract. In case left operand is an array, it produces a new array with elements from `x`, excluding elements from `y`.
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
| `x = y`  | Equals (as `Object.is(x, y)` in JavaScript).
| `x != y` | Not equals (as `!Object.is(x, y)` in JavaScript).
| `x < y`  | Less than.
| `x <= y` | Less than or equal to.
| `x > y`  | Greater than.
| `x >= y` | Greater than or equal to.
| `x ~= y` | Match operator. Behavior depends on `y` type:<br>- RegExp – test against regexp<br>- function – test like `filter()`<br>- `null` or `undefined` – always truthy<br>- anything else – always falsy.

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
| `x or y` | Logical OR. Equivalent to `\|\|` in JavaScript, but `x` is testing for truthy with the `bool()` method.
| `x and y` | Logical AND. Equivalent to `&&` in JavaScript, but `x` is testing for truthy with the `bool()` method.
| `not x`<br>`no x` | Logical NOT. Equivalent to `!` in JavaScript, but `x` is testing for truthy with the `bool()` method.
| `x ? y : z` | Ternary operator. If `x` is truthy, return `y`, else return `z`. `x` is testing for truthy with the `bool()` method.
| `x in [a, b, c]`<br>`[a, b, c] has x` | Equivalent to `x = a or x = b or x = c`.
| `x not in [a, b, c]`<br>`[a, b, c] has no x` | Equivalent to `x != a and x != b and x != c`.


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

// Ternary operator
true ? 'yes' : 'no' // 'yes'
false ? 'yes' : 'no' // 'no'

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

## Grouping operator

Parentheses `( )` serve as the grouping operator, allowing you explicitly define the order in which operations should be executed, ensuring that specific calculations are performed before others. This is particularly useful when dealing with complex expressions, as it helps to avoid unexpected results due to the default operator precedence.

```jora
(1 + 2) * (3 + 4) // 21
```

In this case, the addition operations are performed first, followed by the multiplication, resulting in the correct output of 21. Without the parentheses, the expression would be calculated as `1 + (2 * 3) + 4`, giving a different result of 11.

Within the parentheses, you can also include variable definitions (see [Variables](./variables.md)):

```jora
($a: 1; $a + $a)
```

## Pipeline operator

The pipeline operator `|` in Jora facilitates the simplification of queries by linking expressions in a chain. Its utility is especially evident when treating a query result as a scalar value or reusing the outcome of an extensive or resource-intensive subquery multiple times, without the need for storage in a variable.

For example:

```jora
$values: [1, 2, 3];
$values.sum() / $values.size()
```

Can be rewritten as:

```jora
[1, 2, 3] | sum() + size()
```

See [Pipeline operator](./pipeline-operator.md) for details.

## Operator precedence

The following table shows the operators' precedence from lowest to highest:

| Precedence | Operator |
|-----:|---|
| (lowest) 1 | `\|`
| 2 | `?:`
| 3 | `,`
| 4 | `or`
| 5 | `and`
| 6 | `not` `no`
| 7 | `in` `not in` `has` `has no`
| 8 | `=` `!=` `~=`
| 9 | `<` `<=` `>` `>=`
| 10 | `+` `-`
| 11 | `*` `/` `%`
| (highest) 12 | `( … )`
