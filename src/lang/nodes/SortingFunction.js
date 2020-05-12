module.exports = {
    build(compares) {
        return {
            type: 'SortingFunction',
            compares
        };
    },
    compile(node, ctx) {
        ctx.put('(a, b)=>{let _q;return ');
        ctx.list(node.compares, '||');
        ctx.put('||0}');
    },
    walk(node, ctx) {
        ctx.list(node.compares);
    },
    stringify(node, ctx) {
        ctx.list(node.compares, ',');
    }
};
