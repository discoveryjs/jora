export function suggest(node, ctx) {
    ctx.range(node.property.range, 'path', node.value || undefined, !node.value);

    if (node.value === null) {
        ctx.range(node.property.range, 'var');
    }

    if (node.range &&
        node.value === null &&
        node.property.range[0] !== node.range[0]) {
        ctx.queryRoot(node.range[0]);
    }
}
export function compile(node, ctx) {
    ctx.put(ctx.buildinFn('map'));
    ctx.put('(');
    ctx.nodeOrCurrent(node.value);
    ctx.put(',');

    if (node.property.type === 'Identifier') {
        ctx.put(JSON.stringify(node.property.name));
    } else {
        ctx.node(node.property);
    }

    ctx.put(')');
}
export function walk(node, ctx) {
    ctx.nodeOrNothing(node.value);
    ctx.node(node.property);
}
export function stringify(node, ctx) {
    ctx.nodeOrNothing(node.value) && ctx.put('.');
    ctx.node(node.property);
}
