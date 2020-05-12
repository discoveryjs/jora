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
        if (ctx.scope.firstCurrent === null && !ctx.scope.captureCurrent.disabled) {
            ctx.scope.firstCurrent = ctx.buffer.length;
        }
        ctx.put('current');
    },
    walk() {},
    stringify(node, ctx) {
        ctx.put('$');
    }
};
