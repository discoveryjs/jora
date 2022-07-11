export function suggest(node, ctx) {
    if (node.getter === null) {
        const pos = node.range[1] - 1;
        ctx.range([pos, pos], 'key', node.value, false);
        ctx.queryRoot(pos);
    } else if (
        node.getter.type === 'GetProperty' ||
        node.getter.type === 'Reference' ||
        (node.getter.type === 'Literal' && typeof node.getter.value === 'string')
    ) {
        ctx.range(node.getter.range, 'key', node.value, false);
    }
}
export function compile(node, ctx) {
    ctx.put(ctx.buildinFn('pick'));
    ctx.put('(');
    ctx.node(node.value);

    if (node.getter) {
        ctx.put(',');
        ctx.node(node.getter);
    }

    ctx.put(')');
}
export function walk(node, ctx) {
    ctx.node(node.value);

    if (node.getter !== null) {
        ctx.node(node.getter);
    }
}
export function stringify(node, ctx) {
    ctx.node(node.value);
    ctx.put('[');

    if (node.getter !== null) {
        ctx.node(node.getter);
    }

    ctx.put(']');
}
