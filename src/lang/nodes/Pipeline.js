module.exports = {
    build(left, right) {
        return {
            type: 'Pipeline',
            left,
            right
        };
    },
    compile(node, ctx) {
        ctx.put('(current=>(');
        ctx.node(node.right);
        ctx.put('))(');
        ctx.node(node.left);
        ctx.put(')');
    },
    walk(node, ctx) {
        ctx.node(node.left);
        ctx.node(node.right);
    },
    stringify(node, ctx) {
        ctx.node(node.left);
        ctx.put('|');
        ctx.node(node.right);
    }
};
