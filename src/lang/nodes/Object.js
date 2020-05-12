module.exports = {
    build(properties) {
        return {
            type: 'Object',
            properties
        };
    },
    suggest(node, ctx) {
        if (node.properties.length === 0) {
            ctx.queryRoot(node.range[0] + 1, node.range[1] - 1);
        }
    },
    compile(node, ctx) {
        ctx.put('{');
        ctx.list(node.properties, ',');
        ctx.put('}');
    },
    walk(node, ctx) {
        ctx.list(node.properties);
    },
    stringify(node, ctx) {
        ctx.put('{');
        ctx.list(node.properties, ',');
        ctx.put('}');
    }
};
