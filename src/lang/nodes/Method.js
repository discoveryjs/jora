module.exports = {
    build(reference, args) {
        return {
            type: 'Method',
            reference,
            arguments: args
        };
    },
    suggest(node, ctx) {
        if (node.arguments.length === 0) {
            ctx.queryRoot(node.range[1] - 1);
        }
    },
    compile(node, ctx) {
        ctx.put('m.');
        ctx.node(node.reference);
        ctx.put('(tmp');
        if (node.arguments.length) {
            ctx.put(',');
            ctx.list(node.arguments, ',');
        }
        ctx.put(')');
    },
    walk(node, ctx) {
        ctx.node(node.reference);
        ctx.list(node.arguments);
    },
    stringify(node, ctx) {
        ctx.node(node.reference);
        ctx.put('(');
        ctx.list(node.arguments, ',');
        ctx.put(')');
    }
};
