module.exports = {
    build(value, method) {
        return {
            type: 'MethodCall',
            value,
            method
        };
    },
    compile(node, ctx) {
        ctx.put('(tmp=');
        ctx.nodeOrCurrent(node.value);
        ctx.put(',');
        ctx.node(node.method);
        ctx.put(')');
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
