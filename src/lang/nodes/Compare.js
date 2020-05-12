module.exports = {
    build(query, order) {
        return {
            type: 'Compare',
            query,
            order
        };
    },
    compile(node, ctx) {
        if (node.order === 'desc') {
            ctx.put('-');
        }

        ctx.createScope(
            () => {
                ctx.put('f.cmp((_q=current=>(');
                ctx.node(node.query);
                ctx.put('))(a),_q(b))');
            },
            (scopeStart, sp) => {
                return scopeStart + sp + ',';
            }
        );
    },
    walk(node, ctx) {
        ctx.node(node.query);
    },
    stringify(node, ctx) {
        ctx.node(node.query);
        ctx.put(' ');
        ctx.put(node.order);
    }
};
