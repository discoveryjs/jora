export function compile(node, ctx) {
    ctx.put(ctx.buildinFn('filter'));
    ctx.put('(');
    ctx.nodeOrCurrent(node.value);
    ctx.put(',$=>');
    ctx.createScope(
        () => ctx.node(node.query),
        (sp) => {
            ctx.put(')');
            return '(' + sp + ',';
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
    ctx.put('.[');
    ctx.node(node.query);
    ctx.put(']');
}
