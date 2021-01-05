module.exports = {
    build() {
        return {
            type: 'Context'
        };
    },
    compile(node, ctx) {
        ctx.put('context');
    },
    interpret(node, ctx) {
        return ctx.context;
    },
    walk() {},
    stringify(node, ctx) {
        ctx.put('#');
    }
};
