export function suggest(node, ctx) {
    if (node.range) {
        ctx.range(node.range, 'var');
    }
}
export function compile(node, ctx) {
    if (!ctx.scope.includes(node.name.name) && ctx.tolerant) {
        // FIXME: use ctx.error() here
        ctx.put('(typeof $');
        ctx.node(node.name);
        ctx.put('!=="undefined"?$');
        ctx.node(node.name);
        ctx.put(':undefined)');
        return;
    }

    ctx.put('$');
    ctx.node(node.name);
}
export function walk(node, ctx) {
    ctx.node(node.name);
}
export function stringify(node, ctx) {
    ctx.put('$');
    ctx.node(node.name);
}
