module.exports = {
    build(value, method) {
        return {
            type: 'MethodCall',
            value,
            method
        };
    },
    compile(node, ctx) {
        ctx.node(node.method, node.value);
    },
    interpret(node, ctx) {
        return ctx.interpret(node.method)(ctx.interpret(ctx.nodeOrCurrent(node.value)));
    },
    walk(node, ctx) {
        ctx.nodeOrNothing(node.value);
        ctx.node(node.method);
    },
    stringify(node, ctx) {
        ctx.nodeOrNothing(node.value) && ctx.put('.');
        ctx.node(node.method);
    }
};
