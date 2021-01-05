module.exports = {
    build() {
        return {
            type: 'Data'
        };
    },
    compile(node, ctx) {
        ctx.put('data');
    },
    interpret(node, ctx) {
        return ctx.data;
    },
    walk() {},
    stringify(node, ctx) {
        ctx.put('@');
    }
};
