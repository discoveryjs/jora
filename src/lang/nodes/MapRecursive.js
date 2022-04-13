export function compile(node, ctx) {
    ctx.put(ctx.buildinFn('mapRecursive'));
    ctx.put('(');
    ctx.nodeOrCurrent(node.value);
    ctx.createScope(
        () => {
            ctx.put(',$=>');
            ctx.node(node.query);
        },
        (scopeStart, sp) => {
            ctx.put(')');
            return scopeStart + '(' + sp + ',';
        }
    );
    ctx.put(')');
}
export function walk(node, ctx) {
    ctx.nodeOrNothing(node.value);
    ctx.node(node.query);
}
export function stringify(node, ctx) {
    ctx.nodeOrNothing(node.value);
    ctx.put('..');

    if (ctx.isSimpleGetPropertyQuery(node.query) || ctx.isSimpleMethodCallQuery(node.query)) {
        ctx.node(node.query);
    } else {
        ctx.put('(');
        ctx.node(node.query);
        ctx.put(')');
    }
}
