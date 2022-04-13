export function compile(node, ctx) {
    ctx.put(ctx.buildinFn('slice'));
    ctx.put('(');
    ctx.nodeOrCurrent(node.value);
    node.arguments.slice(0, 3).forEach(item => {
        ctx.put(',');
        item ? ctx.node(item) : ctx.put('undefined');
    });
    ctx.put(')');
}
export function walk(node, ctx) {
    ctx.nodeOrNothing(node.value);

    for (const arg of node.arguments.slice(0, 3)) {
        if (arg) {
            ctx.node(arg);
        }
    }
}
export function stringify(node, ctx) {
    const [a, b, c] = node.arguments;

    ctx.nodeOrNothing(node.value);
    ctx.put('[');

    if (a) {
        ctx.node(a);
    }

    ctx.put(':');

    if (b) {
        ctx.node(b);
    }

    if (c) {
        ctx.put(':');
        ctx.node(c);
    }

    ctx.put(']');
}
