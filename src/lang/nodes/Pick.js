module.exports = {
    build(value, getter) {
        return {
            type: 'Pick',
            value,
            getter
        };
    },
    suggest(node, ctx) {
        if (node.getter === null) {
            ctx.queryRoot(node.range[1] - 1);
        }
    },
    compile(node, ctx) {
        ctx.put('f.pick(');
        ctx.node(node.value);

        if (node.getter) {
            ctx.put(',');
            ctx.node(node.getter);
        }

        ctx.put(')');
    },
    walk(node, ctx) {
        ctx.node(node.value);

        if (node.getter !== null) {
            ctx.node(node.getter);
        }
    },
    stringify(node, ctx) {
        ctx.node(node.value);
        ctx.put('[');

        if (node.getter !== null) {
            ctx.node(node.getter);
        }

        ctx.put(']');
    }
};
