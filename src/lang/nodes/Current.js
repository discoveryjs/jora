module.exports = {
    build() {
        return {
            type: 'Current'
        };
    },
    suggest(node, ctx) {
        if (node.range) {
            ctx.range(node.range, 'var', true);
        }
    },
    compile(node, ctx) {
        ctx.put('current');
    },
    walk() {},
    stringify(node, ctx) {
        ctx.put('$');
    }
};
