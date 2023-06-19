# Recursive mapping

Jora supports recursive mapping through its `..()` syntax. This feature facilitates the traversal of nested data structures. Recursive mapping iteratively maps input values, appends unique mapped values to the result, and applies the mapping to these new values. This process continues until all values in the result are successfully mapped.

## Syntax

```jora
..(expr)
```

For single property getter expressions, the parentheses are optional:

```jora
..property
```

## The algorithm

The recursive mapping process involves the following steps:

1. Initialize an empty `Set` to store the unique results of the recursive mapping.
2. Apply the initial mapping operation on the input using the provided `expr`.
3. Append the results of the initial mapping to the `Set`.
4. Iterate over each element in the Set, applying the mapping operation to each element using `expr`.
5. Append the results of each iteration to the `Set`.
6. Repeat steps 4 and 5 until there are no new elements added to the `Set`.
7. Convert the `Set` to an array and return this final result.

## Examples

Consider the following JSON object representing a directory structure:

```json
{
  "name": "root",
  "type": "directory",
  "children": [
    {
      "name": "folder1",
      "type": "directory",
      "children": [
        {
          "name": "file1.txt",
          "type": "file"
        },
        {
          "name": "file2.txt",
          "type": "file"
        }
      ]
    },
    {
      "name": "folder2",
      "type": "directory",
      "children": [
        {
          "name": "file3.txt",
          "type": "file"
        }
      ]
    }
  ]
}
```

To extract all the objects from this dataset as a list, use recursive mapping:

```jora
..children
// Result:
// [
//     { name: "folder1", type: "directory", children: [{…}, {…}] },
//     { name: "folder2", type: "directory", children: [{…}] },
//     { name: "file1.txt", type: "file" },
//     { name: "file2.txt", type: "file" },
//     { name: "file3.txt", type: "file" }
// ]
```

Note that the original input is not included in the result, only the result of its mapping. To include the input values in the result, use explicit concatenation:

```jora
$ + ..children
// Result:
// [
//     { name: "root", type: "directory", children: [{…}, {…}] },
//     { name: "folder1", type: "directory", children: [{…}, {…}] },
//     { name: "folder2", type: "directory", children: [{…}] },
//     { name: "file1.txt", type: "file" },
//     { name: "file2.txt", type: "file" },
//     { name: "file3.txt", type: "file" }
// ]
```

To apply additional operations to the result, wrap the concatenation in parentheses:

```jora
($ + ..children).name
// Result: ["root", "folder1", "folder2", "file1.txt", "file2.txt", "file3.txt"]
```

The pipeline operator can also be used for the same result:

```jora
$ + ..children | name
// Result: ["root", "folder1", "folder2", "file1.txt", "file2.txt", "file3.txt"]
```

Ensure that operations like filtering are performed after the recursive mapping is complete, to avoid missing some results. The following example returns only the names of files:

```
$ + ..children | .[type = "file"].name
// Result: ["file1.txt", "file2.txt", "file3.txt"]
```

## Commonalities with Mapping

Recursive mapping adheres to the same rules as regular [mapping](./map.md):

- Only unique values are included in the result of recursive mapping.
- If a mapped value results in an array, the elements of the array are added to the result, not the array itself.
- `undefined` values are excluded from the result.

## Infinite loop

Although recursive mapping is a powerful tool, it can potentially lead to an [infinite loop](https://en.wikipedia.org/wiki/Infinite_loop) (endless recursion). To circumvent an infinite loop, avoid creating new objects and arrays. Instead, apply transformation operations to the result of the recursive mapping.

```jora
{ example: 1 }..({ example: 1 }) // This leads to infinite recursion
```

To stop new values from being added to the result, use an empty array. The following example generates a series of numbers from 2 to 5:

```jora
1..($ < 5 ? $ + 1 : [])
// Result: [2, 3, 4, 5]
```
