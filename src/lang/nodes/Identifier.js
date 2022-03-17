export function compile(node, ctx) {
    ctx.put(node.name);
}
export function walk() { }
export function stringify(node, ctx) {
    ctx.put(node.name);
}
