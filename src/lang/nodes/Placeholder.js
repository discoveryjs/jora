export function suggest(node, ctx) {
    ctx.queryRoot(node.range[1]);
}
export function compile(node, ctx) {
    ctx.put(ctx.scope.$ref);
}
export function walk() {}
export function stringify() {}
