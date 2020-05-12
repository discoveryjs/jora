module.exports = {
    build(name) {
        return {
            type: 'Reference',
            name
        };
    },
    suggest(node, ctx) {
        if (node.range) {
            ctx.range(node.range, 'var', true);
        }
    },
    compile(node, ctx) {
        if (ctx.scope.includes(node.name.name)) {
            ctx.put('$');
            ctx.node(node.name);
        } else {
            ctx.put('typeof $');
            ctx.node(node.name);
            ctx.put('!=="undefined"?$');
            ctx.node(node.name);
            ctx.put(':undefined');
        }
    },
    walk(node, ctx) {
        ctx.node(node.name);
    },
    stringify(node, ctx) {
        ctx.put('$');
        ctx.node(node.name);
    }
};
