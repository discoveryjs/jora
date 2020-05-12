module.exports = {
    build(name) {
        return {
            type: 'Declarator',
            name
        };
    },
    compile(node, ctx) {
        if (node.name) {
            ctx.put('$' + node.name);
        }
    },
    walk() {},
    stringify(node, ctx) {
        ctx.put(node.name ? '$' + node.name : '$');
    }
};
