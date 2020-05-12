module.exports = {
    build(query, array) {
        return {
            type: 'Spread',
            query,
            array: Boolean(array)
        };
    },
    suggest(node, ctx) {
        if (!node.query) {
            ctx.queryRoot(node.range[1]);
        }
    },
    compile(node, ctx) {
        ctx.put(node.array ? '...Array.isArray(tmp=' : '...');
        ctx.nodeOrCurrent(node.query);

        if (node.array) {
            ctx.put(')?tmp:[tmp]');
        }
    },
    walk(node, ctx) {
        ctx.nodeOrNothing(node.query);
    },
    stringify(node, ctx) {
        ctx.put('...');
        ctx.nodeOrNothing(node.query);
    }
};
