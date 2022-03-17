export function compile(node, ctx) {
    ctx.put('(');
    ctx.node(node.body);
    ctx.put(')');
}
export function walk(node, ctx) {
    ctx.node(node.body);
}
export function stringify(node, ctx) {
    ctx.put('(');
    ctx.node(node.body);
    ctx.put(')');
}
