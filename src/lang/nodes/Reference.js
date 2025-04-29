export function suggest(node, ctx) {
    if (node.range) {
        ctx.range(node.range, 'var');
    }
}
export function compile(node, ctx) {
    const nameNode = node.name;
    const unescapedName = ctx.unescapeName('$' + nameNode.name, nameNode);
    const inScope = ctx.scope.has(unescapedName);
    const awaitInit = ctx.scope.awaitInit.has(unescapedName);

    if (!inScope || awaitInit) {
        if (awaitInit) {
            ctx.put('f.awaitInitRef(()=>');
            ctx.putIdent(unescapedName, nameNode);

            if (!ctx.tolerant) {
                ctx.put(',');
                ctx.put(JSON.stringify(unescapedName));
                ctx.put(',');
                ctx.put(JSON.stringify(nameNode.range));
            }

            ctx.put(')');
        } else {
            if (ctx.tolerant) {
                ctx.put('undefined');
            } else {
                ctx.putIdent(unescapedName, node); // implicit check identifier name
                ctx.error(`${unescapedName} is not defined`, node);
            }
        }

        return;
    }

    ctx.putIdent(unescapedName, nameNode);
}
export function walk(node, ctx) {
    ctx.node(node.name);
}
export function stringify(node, ctx) {
    ctx.put('$');
    ctx.node(node.name);
}
