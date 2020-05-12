module.exports = {
    build() {
        return {
            type: 'Context'
        };
    },
    compile(node, ctx) {
        ctx.put('context');
    },
    walk() {},
    stringify(node, ctx) {
        ctx.put('#');
    }
};
