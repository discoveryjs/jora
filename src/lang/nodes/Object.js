export function suggest(node, ctx) {
    if (node.properties.length === 0) {
        ctx.queryRoot(node.range[0] + 1, node.range[1] - 1);
    }
}
export function compile(node, ctx) {
    ctx.put('{');
    ctx.list(node.properties, ',');
    ctx.put('}');
}
export function walk(node, ctx) {
    ctx.list(node.properties);
}
export function stringify(node, ctx) {
    ctx.put('{');
    ctx.list(node.properties, ',');
    ctx.put('}');
}
