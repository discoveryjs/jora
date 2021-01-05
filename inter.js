const jora = require('./src');

console.log(jora('$x:=> pick("c") + @.a.b;$x() + #.x', { interpret: true })({ a: { b: 42 }, c: 2}, {x:22}));
