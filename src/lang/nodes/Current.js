module.exports = {
    build() {
        return {
            type: 'Current'
        };
    },
    suggest(node, ctx) {
        if (node.range) {
            ctx.range(node.range, 'var');
        }
    },
    compile(node, ctx) {
        ctx.put('current');
    },
    interpret(node, ctx) {
        return ctx.scope.current;
    },
    walk() {},
    stringify(node, ctx) {
        ctx.put('$');
    }
};
