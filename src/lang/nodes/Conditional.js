module.exports = {
    build(test, consequent, alternate) {
        return {
            type: 'Conditional',
            test,
            consequent,
            alternate
        };
    },
    compile(node, ctx) {
        ctx.put('f.bool(');
        ctx.node(node.test);
        ctx.scope.captureCurrent.disabled = true;
        ctx.put(')?');
        ctx.node(node.consequent);
        ctx.put(':');
        ctx.node(node.alternate);
        ctx.scope.captureCurrent.disabled = false;
    },
    walk(node, ctx) {
        ctx.node(node.test);
        ctx.node(node.consequent);
        ctx.node(node.alternate);
    },
    stringify(node, ctx) {
        ctx.node(node.test);
        ctx.put('?');
        ctx.node(node.consequent);
        ctx.put(':');
        ctx.node(node.alternate);
    }
};
