[↢ back to list](../README.md)

# map

The **map** method creates a new array and replaces the elements of the given array with the results of calling a provided function on every element.

The map method has a shorthand syntax `.()` in **Jora**.

In addition to working with arrays, map method works on primitive types and objects, which allows you to transform your data in almost any way desired, while keeping your queries very simple.

> **NB** Please note that map method produces unique values, you can read more about [the concept of unique values](../concept-unique-values.md). As an implication the resulting array can have smaller length than the original array.

> **NB** Please also note that if an expression returns an array, its result is concatenated with the overall result.  As an implication of this behaviour the resulting array can have bigger length than the original array

## Syntax

```
.map(<fn>)
.(block)
```

### Example: pick object properties

Suppose that we only care what the value of `"baz"` is in the object.

#### Input
```json
[
    {
        "foo": "bar",
        "baz": 1
    },
    {
        "foo": "bar",
        "baz": 2
    },
    {
        "foo": "bar",
        "baz": 3
    }
]
```

#### Query
```txt
.({ baz })
```

or

```txt
.map(<{ baz }>)
```

#### Output
```json
[
    {
        "baz": 1
    },
    {
        "baz": 2
    },
    {
        "baz": 3
    }
]
```

[Try it in JSFiddle](https://jsfiddle.net/homyasusina/dvgnp78e/)

### Example: pick property values

Suppose that we want to turn our array into array of `"baz"` values:

#### Input
```json
[
    {
        "baz": 1
    },
    {
        "baz": 2
    },
    {
        "baz": 3
    }
]
```

#### Query

```txt
.(baz)
```

or

```txt
.map(<baz>)
```

or simply

```txt
.baz
```

#### Output
```json
[
    1,
    2,
    3
]
```

[Try it in JSFiddle](https://jsfiddle.net/homyasusina/fmL6ac3j/)

### Example: rename property

#### Input
```json
[
    {
        "a": 42
    },
    {
        "a": 42
    },
    {
        "a": 42
    }
]
```

#### Query
```txt
.({ answer: a })
```

or

```txt
.map(<{ answer: a }>)
```

#### Output
```json
[
    {
        "answer": 42
    },
    {
        "answer": 42
    },
    {
        "answer": 42
    }
]
```

[Try it in JSFiddle](https://jsfiddle.net/homyasusina/rjpxbLh5/)

### Example: Mapping a number

In Jora map operation can also apply to numbers, strings etc... For example - you can take the primitive value and store it in an object:

#### Input
```json
123
```

#### Query
```txt
.({ foo: $})
```
or

```txt
.map(<{ foo: $ }>)
```

> **NB** in the above example `$` references the current value

#### Output
```json
{
    "foo": 123
}
```

[Try it in JSFiddle](https://jsfiddle.net/homyasusina/bogc39uy/)

### Example: Copying over the object with spread and computing additional properties

Yes, you can map and object too.

#### Input
```json
{
    "foo": 41
}
```

#### Query
```txt
.({ ..., answer: foo + 1 })
```

or

```txt
.map(<{ ..., answer: foo + 1 }>)
```

#### Output
```json
{
    "foo": 41,
    "answer": 42
}
```

[Try it in JSFiddle](https://jsfiddle.net/homyasusina/r97ybdhn/)
