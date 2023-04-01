export function compile(node, ctx) {
    ctx.createScope(
        () => {
            ctx.put('($=>(');
            ctx.node(node.right);
            ctx.put('))');
        },
        (scopeStart, sp) => {
            return scopeStart + sp + ',';
        }
    );

    ctx.put('(');
    ctx.node(node.left);
    ctx.put(')');
}
export function walk(node, ctx) {
    ctx.node(node.left);
    ctx.node(node.right);
}
export function stringify(node, ctx) {
    ctx.node(node.left);
    ctx.put('|');
    ctx.node(node.right);
}
