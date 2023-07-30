export function compile(node, ctx) {
    if (node.operator && node.operator.type) {
        ctx.createScope(
            () => {
                ctx.put('($=>');
                ctx.node(node.operator);
                ctx.put(')');
            },
            (scopeStart, sp) => {
                return scopeStart + sp + ';';
            }
        );
        ctx.put('(');
        ctx.node(node.argument);
        ctx.put(')');
        return;
    }

    switch (node.operator) {
        default: {
            ctx.error('Unknown operator "' + node.operator + '"', node);
        }
    }
}
export function walk(node, ctx) {
    ctx.node(node.argument);

    if (node.operator && node.operator.type) {
        ctx.node(node.operator);
    }
}
export function stringify(node, ctx) {
    ctx.node(node.argument);
    ctx.put(' ');
    ctx.node(node.operator);
}
