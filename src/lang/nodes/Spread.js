export function suggest(node, ctx) {
    if (node.query === null) {
        ctx.queryRoot(node.range[1]);
    }
}
export function compile(node, ctx) {
    if (node.array) {
        ctx.put('...');
        ctx.put(ctx.buildinFn('ensureArray'));
        ctx.put('(');
        ctx.nodeOrCurrent(node.query);
        ctx.put(')');
        return;
    }

    ctx.put('...');
    ctx.nodeOrCurrent(node.query);
}
export function walk(node, ctx) {
    ctx.nodeOrNothing(node.query);
}
export function stringify(node, ctx) {
    ctx.put('...');
    ctx.nodeOrNothing(node.query);
}
