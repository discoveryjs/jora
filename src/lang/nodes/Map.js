module.exports = {
    build(value, query) {
        return {
            type: 'Map',
            value,
            query
        };
    },
    compile(node, ctx) {
        ctx.put('f.map(');
        ctx.nodeOrCurrent(node.value);
        ctx.createScope(
            () => {
                ctx.put(',current=>');
                ctx.node(node.query);
            },
            (scopeStart, sp) => {
                ctx.put(')');
                return scopeStart + '(' + sp + ',';
            }
        );
        ctx.put(')');
    },
    walk(node, ctx) {
        ctx.nodeOrNothing(node.value);
        ctx.node(node.query);
    },
    stringify(node, ctx) {
        ctx.nodeOrNothing(node.value);
        ctx.put('.(');
        ctx.node(node.query);
        ctx.put(')');
    }
};
