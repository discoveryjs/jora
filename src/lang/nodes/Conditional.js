export function compile(node, ctx) {
    ctx.put(ctx.buildinFn('bool'));
    ctx.put('(');
    ctx.node(node.test);
    ctx.scope.captureCurrent.disabled = true;
    ctx.put(')?');
    ctx.node(node.consequent);
    ctx.put(':');
    ctx.node(node.alternate);
    ctx.scope.captureCurrent.disabled = false;
}
export function walk(node, ctx) {
    ctx.node(node.test);
    ctx.node(node.consequent);
    ctx.node(node.alternate);
}
export function stringify(node, ctx) {
    ctx.node(node.test);
    ctx.put('?');
    ctx.node(node.consequent);
    ctx.put(':');
    ctx.node(node.alternate);
}
