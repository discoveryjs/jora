module.exports = {
    build(elements) {
        return {
            type: 'Array',
            elements
        };
    },
    suggest(node, ctx) {
        if (node.elements.length === 0) {
            ctx.queryRoot(node.range[0] + 1, node.range[1] - 1);
        }
    },
    compile(node, ctx) {
        ctx.put('[');
        ctx.list(node.elements, ',');
        ctx.put(']');
    },
    interpret(node, ctx) {
        return node.elements.map(element => ctx.interpret(element));
    },
    walk(node, ctx) {
        ctx.list(node.elements);
    },
    stringify(node, ctx) {
        ctx.put('[');
        ctx.list(node.elements, ',');
        ctx.put(']');
    }
};
