export function compile(node, ctx) {
    ctx.node(node.method, node.value);
}
export function walk(node, ctx) {
    ctx.nodeOrNothing(node.value);
    ctx.node(node.method);
}
export function stringify(node, ctx) {
    ctx.nodeOrNothing(node.value) && ctx.put('.');
    ctx.node(node.method);
}
