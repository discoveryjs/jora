export function compile(node, ctx) {
    ctx.put(ctx.buildinFn('map'));
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
    ctx.put('.(');
    ctx.node(node.query);
    ctx.put(')');
}
