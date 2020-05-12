module.exports = {
    build() {
        return {
            type: 'Data'
        };
    },
    compile(node, ctx) {
        ctx.put('data');
    },
    walk() {},
    stringify(node, ctx) {
        ctx.put('@');
    }
};
