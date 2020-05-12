module.exports = {
    build(name) {
        return {
            type: 'Identifier',
            name
        };
    },
    compile(node, ctx) {
        ctx.put(node.name);
    },
    walk() {},
    stringify(node, ctx) {
        ctx.put(node.name);
    }
};
