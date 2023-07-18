export function compile(node, ctx) {
    ctx.createScope(
        () => {
            ctx.node(node.assertion);
            ctx.put('?');
            ctx.nodeOrCurrent(node.then);
            if (node.else) {
                ctx.put(':');
                ctx.node(node.else);
            } else {
                ctx.put(':undefined');
            }
        },
        (scopeStart, sp) => {
            return scopeStart + sp + ';';
        }
    );
}
export function walk(node, ctx) {
    ctx.node(node.assertion);
    ctx.nodeOrNothing(node.then);
    ctx.nodeOrNothing(node.else);
}
export function stringify(node, ctx) {
    ctx.put('if ');
    ctx.node(node.assertion);

    if (node.then) {
        ctx.put(' then ');
        ctx.node(node.then);
    }

    if (node.else) {
        ctx.put(' else ');
        ctx.node(node.else);
    }
}
