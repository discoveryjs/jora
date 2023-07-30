export function compile(node, ctx) {
    switch (node.operator) {
        case 'no':
        case 'not':
            ctx.put('!');
            ctx.put(ctx.buildinFn('bool'));
            ctx.put('(');
            ctx.node(node.argument);
            ctx.put(')');
            break;

        case '+':
        case '-':
            ctx.put(node.operator);
            ctx.node(node.argument);
            break;

        case 'is':
            ctx.put('!!(');
            ctx.node(node.argument);
            ctx.put(')');
            break;

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
    ctx.put(node.operator);

    if (node.operator !== '-' && node.operator !== '+') {
        ctx.put(' ');
    }

    ctx.node(node.argument);
}
