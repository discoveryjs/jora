module.exports = {
    build(value, property) {
        return {
            type: 'GetProperty',
            value,
            property
        };
    },
    suggest(node, ctx) {
        ctx.range(node.property.range, 'path', node.value || undefined, !node.value);

        if (node.value === null) {
            ctx.range(node.property.range, 'var');
        }

        if (node.range &&
            node.value === null &&
            node.property.range[0] !== node.range[0]) {
            ctx.queryRoot(node.range[0]);
        }
    },
    compile(node, ctx) {
        ctx.put('f.map(');
        ctx.nodeOrCurrent(node.value);
        ctx.put(',');

        if (node.property.type === 'Identifier') {
            ctx.put(JSON.stringify(node.property.name));
        } else {
            ctx.node(node.property);
        }

        ctx.put(')');
    },
    walk(node, ctx) {
        ctx.nodeOrNothing(node.value);
        ctx.node(node.property);
    },
    stringify(node, ctx) {
        ctx.nodeOrNothing(node.value) && ctx.put('.');
        ctx.node(node.property);
    }
};
