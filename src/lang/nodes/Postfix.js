export function compile(node, ctx) {
    if (node.operator && node.operator.type) {
        ctx.put('($=>(');
        ctx.createScope(
            () => ctx.node(node.operator),
            (sp) => sp + ','
        );
        ctx.put('))');
        ctx.put('(');
        ctx.node(node.argument);
        ctx.put(')');
        return;
    }

    ctx.error('Unknown operator "' + node.operator + '"', node);
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
