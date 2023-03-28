# Grouping: `group()` method

The `group()` method in Jora allows you to group data in arrays based on specified properties or computed values. The method returns an array of objects containing a `key` and a `value` property. The `key` represents the grouping criterion, and the `value` is an array of unique input elements associated with that key. Note that keys can be any value, even an object.

The `group()` method can take two optional parameters: 
1. A function that defines the grouping key. 
2. A mapping function for the value (optional). 

When the second parameter is omitted, the mapping function defaults to `=> $`, which means the input element itself will be used as the value.

In this article, we'll explore various examples of using the `group()` method in Jora to group data in different ways.

## Syntax

```
.group(keyFunction[, valueFunction])
```

## Examples

- [Grouping by a property](#grouping-by-a-property)
- [Grouping by a computed property](#grouping-by-a-computed-property)
- [Grouping by a list of values](#grouping-by-a-list-of-values)
- [Using an object as a group key](#using-an-object-as-a-group-key)
- [Values in the `value` array are unique](#values-in-the-value-array-are-unique)
- [Using mapping with `group()` method to get the desired shape of the result](#using-mapping-with-group-method-to-get-the-desired-shape-of-the-result)
- [Using `group()` method with `fromEntries()` method to convert the result into an object](#using-group-method-with-fromentries-method-to-convert-the-result-into-an-object)

### Grouping by a property

Suppose you have an array of objects representing sales data, and you want to group the data by the `"region"` property while keeping only the sales values in the resulting groups.

`Input`

```json
[
    { "region": "North", "sales": 100 },
    { "region": "South", "sales": 200 },
    { "region": "East", "sales": 150 },
    { "region": "North", "sales": 300 },
    { "region": "South", "sales": 250 }
]
```

`Query`

```jora
.group(=> region, => sales)
```

or

```jora
.group(=> region).({ key, value: value.(sales) })
```

`Output`

```json
[
    { "key": "North", "value": [100, 300] },
    { "key": "South", "value": [200, 250] },
    { "key": "East", "value": [150] }
]
```

### Grouping by a computed property

You can also group data based on a computed property. In this example, we'll group an array of numbers into even and odd groups.

`Input`

```json
[ 1, 2, 3, 4, 5, 6 ]
```

`Query`

```jora
.group(=> $ % 2 ? 'odd' : 'even')
```

`Output`

```json
[
    { "key": "odd", "value": [1, 3, 5] },
    { "key": "even", "value": [2, 4, 6] }
]
```

### Grouping by a list of values

Suppose you have an array of objects representing products with multiple tags. You want to group products by each tag.

`Input`

```json
[
    { "name": "Product A", "tags": ["Electronics", "Gadgets"] },
    { "name": "Product B", "tags": ["Electronics", "Computers"] },
    { "name": "Product C", "tags": ["Gadgets"] },
    { "name": "Product D", "tags": ["Computers"] }
]
```

`Query`

```jora
.group(=> tags)
```

`Output`

```json
[
    {
        "key": "Electronics",
        "value": [
            { "name": "Product A", "tags": ["Electronics", "Gadgets"] },
            { "name": "Product B", "tags": ["Electronics", "Computers"] }
        ]
    },
    {
        "key": "Gadgets",
        "value": [
            { "name": "Product A", "tags": ["Electronics", "Gadgets"] },
            { "name": "Product C", "tags": ["Gadgets"] }
        ]
    },
    {
        "key": "Computers",
        "value": [
            { "name": "Product B", "tags": ["Electronics", "Computers"] },
            { "name": "Product D", "tags": ["Computers"] }
        ]
    }
]
```

### Using an object as a group key

Suppose you have an array of objects representing sales data with different currencies. You want to group sales data by the currency object.

`Input`

```js
const USD = { "code": "USD", "symbol": "$" };
const EUR = { "code": "EUR", "symbol": "€" };
const data = [
    { "amount": 100, "currency": USD },
    { "amount": 150, "currency": USD },
    { "amount": 200, "currency": EUR },
    { "amount": 250, "currency": EUR }
];
```

`Query`

```jora
.group(=> currency)
```

`Output`

```json
[
    {
        "key": { "code": "USD", "symbol": "$" },
        "value": [
            { "amount": 100, "currency": { "code": "USD", "symbol": "$" } },
            { "amount": 150, "currency": { "code": "USD", "symbol": "$" } }
        ]
    },
    {
        "key": { "code": "EUR", "symbol": "€" },
        "value": [
            { "amount": 200, "currency": { "code": "EUR", "symbol": "€" } },
            { "amount": 250, "currency": { "code": "EUR", "symbol": "€" } }
        ]
    }
]
```

### Values in the `value` array are unique

The `group()` method ensures that the elements in the `value` array are unique.

`Input`

```js
const a = { "category": "Electronics", "name": "Product A" };
const b = { "category": "Electronics", "name": "Product B" };
const c = { "category": "Gadgets", "name": "Product C" };
const input = [a, b, b, c, a];
```

`Query`

```jora
.group(=> category)
```

`Output`

```json
[
    {
        "key": "Electronics",
        "value": [
            { "category": "Electronics", "name": "Product A" },
            { "category": "Electronics", "name": "Product B" }
        ]
    },
    {
        "key": "Gadgets",
        "value": [
            { "category": "Gadgets", "name": "Product B" }
        ]
    }
]
```

### Using mapping with `group()` method to get the desired shape of the result

Suppose you have an array of objects representing sales data, and you want to count the number of sales per region.

`Input`

```json
[
    { "region": "North", "sales": 100 },
    { "region": "South", "sales": 200 },
    { "region": "East", "sales": 150 },
    { "region": "North", "sales": 300 },
    { "region": "South", "sales": 250 }
]
```

`Query`

```jora
.group(=> region)
.({
    region: key,
    salesCount: value.size(),
    totalSales: value.reduce(=> $$ + sales, 0) // sum of sales
})
```

`Output`

```json
[
    { "region": "North", "salesCount": 2, "totalSales": 400 },
    { "region": "South", "salesCount": 2, "totalSales": 450 },
    { "region": "East", "salesCount": 1, "totalSales": 150 }
]
```

### Using `group()` method with `fromEntries()` method to convert the result into an object

`fromEntries()` is a convenient method to convert an array of objects with `{ key, value }` structure into an object. As the `group()` method returns an array of such objects, you can use `fromEntries()` directly to transform the grouped result into an object.

Suppose you have an array of objects representing sales data, and you want to group the data by region.

`Input`

```json
[
    { "region": "North", "sales": 100 },
    { "region": "South", "sales": 200 },
    { "region": "East", "sales": 150 },
    { "region": "North", "sales": 300 },
    { "region": "South", "sales": 250 }
]
```

`Query`

```jora
.group(=> region)
.fromEntries()
```

`Output`

```json
{
    "North": [
        { "region": "North", "sales": 100 },
        { "region": "North", "sales": 300 }
    ],
    "South": [
        { "region": "South", "sales": 200 },
        { "region": "South", "sales": 250 }
    ],
    "East": [
        { "region": "East", "sales": 150 }
    ]
}
