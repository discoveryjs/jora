[↢ back to list](../README.md)

# Main concepts

## Values that result from queries are unique

Consider this example, we are going copy over each element of the array, notice how the array becomes unique after this query:

#### Input
```json
[
    1,
    2,
    2,
    3
]
```

#### Query
```txt
.($)
```

#### Output
```json
[
    1,
    2,
    3
]
```

[Try it in JSFiddle](https://jsfiddle.net/homyasusina/gkfshna7/)

Comparison works the same as in Javascript, two objects are never equal unless they are the same object:

#### Input
```json
[
    {
        "a": 1
    },
    {
        "a": 2
    },
    {
        "a": 2
    },
    {
        "a": 3
    }
]
```

#### Query
```txt
.($)
```

#### Output
```json
[
    {
        "a": 1
    },
    {
        "a": 2
    },
    {
        "a": 2
    },
    {
        "a": 3
    }
]
```

[Try it in JSFiddle](https://jsfiddle.net/homyasusina/g963pwmr/)
