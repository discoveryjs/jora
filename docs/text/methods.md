### Build-in methods

jora | Description
--- | ---
bool() | The same as `Boolean()` in JS, with exception that *empty arrays* and *objects with no keys* treats as falsy
keys() | The same as `Object.keys()` in JS
values() | The same as `Object.values()` in JS
entries() | Similar to `Object.entries()` in JS with a difference: `{ key, value }` objects is using for entries instead of array tuples
fromEntries() | Similar to `Object.fromEntries()` in JS with difference: `{ key, value }` objects are expecting as entries instead of array tuples
pick("key")<br>pick(index)<br>pick(fn) | Get a value by a key, an index or a function. It returns an element with `e` index for arrays, a char with `e` index for strings, and a value with `e` key (must be own key) for enything else. Negative indecies are supported for arrays and strings. Current value is element for an array, a char for a string or an entry value for object. Arg1 (i.e. `$$`) is an index for arrays and strings, and a key for objects.
size() | Returns count of keys if current data is object, otherwise returns `length` value or `0` when field is absent
sort(\<fn>) | Sort an array by a value fetched with getter (`<fn>`). Keep in mind, you can use sorting function definition syntax using `asc` and `desc` keywords, qhich is more effective in many ways. In case of sorting function definition usage, `<` and `>` are not needed and you can specify sorting order for each component. Following queries are equivalents:<br>`sort(<foo.bar>)` and `sort(foo.bar asc)`<br>`sort(<foo>).reverse()` and `sort(foo desc)`<br>`sort(<[a, b]>)` and `sort(a asc, b asc)`
reverse() | Reverse order of items
group(\<fn>[, \<fn>]) | Group an array items by a value fetched with first getter.
filter(\<fn>) | The same as `Array#filter()` in JS
map(\<fn>) | The same as `Array#map()` in JS
split(pattern) | The same as `String#split()` in JS. `pattern` may be a string or regexp
join(separator) | The same as `Array#join()` in JS. When `separator` is undefined then `","` is using
slice(from, to) | The same as `Array#slice()` or `String#slice()` in JS
match(pattern, matchAll) | Similar to `String#match()`. Since regexp'es in jora doesn't support for `g` flag, use `matchAll` argument to get all matches, i.e. `'abcabc'.match(/ab/, true)` (jora) instead of `'abcabc'.match(/ab/g)` (JS)
reduce(fn\[, initValue]) | The same as `Array#reduce()` in JS. Use `$$` to access to accumulator and `$` to current value, e.g. find the max value `reduce(=>$ > $$ ? $ : $$)`
