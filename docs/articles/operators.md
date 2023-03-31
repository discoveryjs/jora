# Operators

Jora offers a variety of operators to perform operations, comparisons, and boolean logic on data. This guide will cover the available operators and their usage.

- [Arithmetic operators](#arithmetic-operators)
- [Comparisons](#comparisons)
- [Logical operators](#logical-operators)
- [Grouping operator](#grouping-operator)
- [Operator precedence](#operator-precedence)

## Arithmetic operators

| Jora | Description |
|------|-------------|
| x + y | Add.<br>In case one of the operands is an array, it produces a new array with elements from `x` and `y`, excluding duplicates.
| x - y | Subtract.<br>In case left operand is an array, it produces a new array with elements from `x`, excluding elements from `y`.
| x * y | Multiply.
| x / y | Divide.
| x % y | Modulo.

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

## Comparisons

| Jora | Description |
|------|-------------|
| x = y | Equals (as `Object.is(x, y)` in JavaScript).
| x != y | Not equals (as `!Object.is(x, y)` in JavaScript).
| x < y | Less than.
| x <= y | Less than or equal to.
| x > y | Greater than.
| x >= y | Greater than or equal to.
| x ~= y | Match operator. Behavior depends on `y` type:<br>- RegExp – test against regexp<br>- function – test like `filter()`<br>- `null` or `undefined` – always truthy<br>- anything else – always falsy.

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
| x or y | Logical `or`. Equivalent to `\|\|` in JavaScript, but `x` tests with the `bool()` method.
| x and y | Logical `and`. Equivalent to `&&` in JavaScript, but `x` tests with the `bool()` method.
| not x<br>no x | Logical `not`. Equivalent to `!` in JavaScript, but `x` tests with the `bool()` method.
| x ? y : z | Ternary operator. If `x` is truthy, return `y`, else return `z`. `x` tests with the `bool()` method.
| x in [a, b, c]<br>[a, b, c] has x | Equivalent to `x = a or x = b or x = c`.
| x not in [a, b, c]<br>[a, b, c] has no x | Equivalent to `x != a and x != b and x != c`.

```jora
// Boolean OR
true or false // true
[] or false // false

// Boolean AND
true and false // false
true and true // true

// Boolean NOT
not true // false
no false // true

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

Within the parentheses, you can also include definitions for better readability and maintainability of your code. Here's an example:

```jora
($a: 1; $a + $a)
```

## Operator precedence

The following table shows the operators' precedence from lowest to highest:

| |
|------|
| `\|`
| `?:`
| `,`
| `or`
| `and`
| `not` `no`
| `in` `not in` `has` `has no`
| `=` `!=` `~=`
| `<` `<=` `>` `>=`
| `+` `-`
| `*` `/` `%`
| `( … )`
