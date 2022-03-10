export function build(args, body, legacy) {
    return {
        type: 'Function',
        arguments: args,
        body,
        legacy: Boolean(legacy)
    };
}
export function compile(node, ctx) {
    ctx.createScope(
        () => {
            ctx.scope.arg1 = true;
            ctx.put('function(current){return ');
            ctx.node(node.body);
            ctx.put('}');
        },
        (scopeStart, sp) => {
            return scopeStart + sp + ',';
        }
    );
}
export function walk(node, ctx) {
    ctx.node(node.body);
}
export function stringify(node, ctx) {
    if (node.legacy) {
        ctx.put('<');
        ctx.node(node.body);
        ctx.put('>');
    } else {
        ctx.put('=>');
        ctx.node(node.body);
    }
}
