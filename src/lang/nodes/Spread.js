module.exports = {
    build(query, array = false) {
        return {
            type: 'Spread',
            query,
            array
        };
    },
    suggest(node, ctx) {
        if (node.query === null) {
            ctx.queryRoot(node.range[1]);
        }
    },
    compile(node, ctx) {
        if (node.array) {
            ctx.put('...Array.isArray(tmp=');
            ctx.nodeOrCurrent(node.query);
            ctx.put(')?tmp:[tmp]');
            return;
        }

        ctx.put('...');
        ctx.nodeOrCurrent(node.query);
    },
    walk(node, ctx) {
        ctx.nodeOrNothing(node.query);
    },
    stringify(node, ctx) {
        ctx.put('...');
        ctx.nodeOrNothing(node.query);
    }
};
