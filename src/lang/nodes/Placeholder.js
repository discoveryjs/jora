export function suggest(node, ctx) {
    ctx.queryRoot(node.range[1]);
}
export function compile(node, ctx) {
    ctx.put('$');
}
export function walk() {}
export function stringify() {}
