module.exports = {
    build(definitions, body) {
        return {
            type: 'Block',
            definitions,
            body
        };
    },
    suggest(node, ctx) {
        if (node.body === null) {
            ctx.queryRoot(node.range[1]);
        }
    },
    compile(node, ctx) {
        if (node.definitions.length) {
            ctx.createScope(
                () => {
                    ctx.put('(()=>{');
                    ctx.list(node.definitions);
                    ctx.put('return ');
                    ctx.nodeOrCurrent(node.body);
                    ctx.put('})()');
                },
                (scopeStart, sp) => {
                    return scopeStart + sp + ';';
                }
            );
        } else if (node.body && node.body.type === 'Object') {
            ctx.put('(');
            ctx.nodeOrCurrent(node.body);
            ctx.put(')');
        } else {
            ctx.nodeOrCurrent(node.body);
        }
    },
    walk(node, ctx) {
        ctx.list(node.definitions);
        ctx.nodeOrNothing(node.body);
    },
    stringify(node, ctx) {
        ctx.list(node.definitions);
        ctx.nodeOrNothing(node.body);
    }
};
