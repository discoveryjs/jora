export function compile(node, ctx) {
    ctx.put(ctx.buildinFn('bool'));
    ctx.put('(');
    ctx.scope.captureCurrent.disabled = true;
    ctx.nodeOrCurrent(node.test);
    ctx.put(')?');
    ctx.nodeOrCurrent(node.consequent);
    ctx.put(':');
    if (node.alternate) {
        ctx.node(node.alternate);
    } else {
        ctx.put('undefined');
    }
    ctx.scope.captureCurrent.disabled = false;
}
export function walk(node, ctx) {
    ctx.nodeOrNothing(node.test);
    ctx.nodeOrNothing(node.consequent);
    ctx.nodeOrNothing(node.alternate);
}
export function stringify(node, ctx) {
    ctx.nodeOrNothing(node.test);
    ctx.put('?');
    ctx.nodeOrNothing(node.consequent);

    if (node.alternate) {
        ctx.put(':');
        ctx.node(node.alternate);
    }
}
