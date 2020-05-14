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
    walk(node, ctx) {
        ctx.nodeOrNothing(node.value);
        ctx.node(node.method);
    },
    stringify(node, ctx) {
        ctx.nodeOrNothing(node.value) && ctx.put('.');
        ctx.node(node.method);
    }
};
