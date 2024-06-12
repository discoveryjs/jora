export function suggest(node, ctx) {
    if (node.range) {
        ctx.range(node.range, 'var');
    }
}
export function compile(node, ctx) {
    const nameNode = node.name;
    const inScope = ctx.scope.has(nameNode.name);
    const awaitInit = ctx.scope.awaitInit.has(nameNode.name);

    if (!inScope || awaitInit) {
        if (awaitInit) {
            ctx.put('f.unsafeRef(()=>$');
            ctx.node(nameNode);

            if (!ctx.tolerant) {
                ctx.put(',');
                ctx.put(JSON.stringify(nameNode.name));
                ctx.put(',');
                ctx.put(JSON.stringify(nameNode.range));
            }

            ctx.put(')');
        } else {
            if (ctx.tolerant) {
                ctx.put('undefined');
            } else {
                ctx.error(`$${nameNode.name} is not defined`, nameNode);
            }
        }

        return;
    }

    ctx.put('$');
    ctx.node(nameNode);
}
export function walk(node, ctx) {
    ctx.node(node.name);
}
export function stringify(node, ctx) {
    ctx.put('$');
    ctx.node(node.name);
}
