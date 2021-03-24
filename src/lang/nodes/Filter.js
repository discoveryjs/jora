module.exports = {
    build(value, query) {
        return {
            type: 'Filter',
            value,
            query
        };
    },
    compile(node, ctx) {
        ctx.put('f.filter(');
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
    interpret(node, ctx) {
        return ctx.buildin.filter(
            ctx.interpret(ctx.nodeOrCurrent(node.value)),
            current => ctx.runInScope(current, () => ctx.interpret(node.query))
        );
    },
    walk(node, ctx) {
        ctx.nodeOrNothing(node.value);
        ctx.node(node.query);
    },
    stringify(node, ctx) {
        ctx.nodeOrNothing(node.value);
        ctx.put('.[');
        ctx.node(node.query);
        ctx.put(']');
    }
};
