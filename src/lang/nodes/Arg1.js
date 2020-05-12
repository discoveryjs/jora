module.exports = {
    build() {
        return {
            type: 'Arg1'
        };
    },
    compile(node, ctx) {
        ctx.put(ctx.scope.arg1 ? 'arguments[1]' : 'undefined');
    },
    walk() {},
    stringify(node, ctx) {
        ctx.put('$$');
    }
};
