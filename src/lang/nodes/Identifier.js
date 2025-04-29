export function compile(node, ctx) {
    ctx.put(JSON.stringify(ctx.unescapeName(node.name, node, false)));
}
export function walk() { }
export function stringify(node, ctx) {
    ctx.put(node.name);
}
