export function compile(node, ctx) {
    ctx.put('(a, b)=>{let _q;return ');
    ctx.list(node.compares, '||');
    ctx.put('||0}');
}
export function walk(node, ctx) {
    ctx.list(node.compares);
}
export function stringify(node, ctx) {
    ctx.list(node.compares, ',');
}
