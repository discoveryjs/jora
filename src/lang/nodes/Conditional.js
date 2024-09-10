export function compile(node, ctx) {
    ctx.put(ctx.buildinFn('bool'));
    ctx.put('(');
    ctx.nodeOrCurrent(node.test);
    ctx.put(')?');
    ctx.createScope(
        () => ctx.nodeOrCurrent(node.consequent),
        (sp) => {
            ctx.put(')');
            return '(' + sp + ',';
        },
        ctx.scope.$ref
    );
    ctx.put(':');
    ctx.createScope(
        () => {
            if (node.alternate) {
                if (node.alternate.type === 'Placeholder') {
                    ctx.put('(');
                    ctx.node(node.alternate);
                    ctx.put(',undefined)');
                } else {
                    ctx.node(node.alternate);
                }
            } else {
                ctx.put('undefined');
            }
        },
        (sp) => {
            ctx.put(')');
            return '(' + sp + ',';
        },
        ctx.scope.$ref
    );
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
