const comparator = {
    '': 'cmp',
    'N': 'cmpNatural',
    'A': 'cmpAnalytical',
    'NA': 'cmpNaturalAnalytical',
    'AN': 'cmpNaturalAnalytical'
};

export function build(query, order) {
    return {
        type: 'Compare',
        query,
        order
    };
}
export function compile(node, ctx) {
    if (node.order.startsWith('desc')) {
        ctx.put('-');
    }

    ctx.createScope(
        () => {
            const cmpFn = comparator[node.order.slice(3 + node.order.startsWith('desc'))] || comparator[''];

            ctx.put('f.' + cmpFn + '((_q=current=>(');
            ctx.node(node.query);
            ctx.put('))(a),_q(b))');
        },
        (scopeStart, sp) => {
            return scopeStart + sp + ',';
        }
    );
}
export function walk(node, ctx) {
    ctx.node(node.query);
}
export function stringify(node, ctx) {
    ctx.node(node.query);
    ctx.put(' ');
    ctx.put(node.order);
}
