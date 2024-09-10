const comparator = {
    '': 'cmp',
    'N': 'cmpNatural',
    'A': 'cmpAnalytical',
    'NA': 'cmpNaturalAnalytical',
    'AN': 'cmpNaturalAnalytical'
};

export function compile(node, ctx) {
    const isDesc = node.order.startsWith('desc');
    const cmpFn = comparator[node.order.slice(isDesc ? 4 : 3)] || comparator[''];

    if (isDesc) {
        ctx.put('-');
    }

    ctx.put(ctx.buildinFn(cmpFn));
    ctx.put('((_q=$=>(');
    ctx.createScope(
        () => ctx.node(node.query),
        (sp) => sp + ','
    );
    ctx.put('))(_a),_q(_b))');
}
export function walk(node, ctx) {
    ctx.node(node.query);
}
export function stringify(node, ctx) {
    ctx.node(node.query);
    ctx.put(' ');
    ctx.put(node.order);
}
