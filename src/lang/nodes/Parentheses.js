module.exports = {
    build(body) {
        return {
            type: 'Parentheses',
            body
        };
    },
    compile(node, ctx) {
        ctx.put('(');
        ctx.node(node.body);
        ctx.put(')');
    },
    walk(node, ctx) {
        ctx.node(node.body);
    },
    interpret(node, ctx) {
        return ctx.interpret(node.body);
    },
    stringify(node, ctx) {
        ctx.put('(');
        ctx.node(node.body);
        ctx.put(')');
    }
};
