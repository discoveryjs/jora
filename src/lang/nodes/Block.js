export function suggest(node, ctx) {
    if (node.body === null) {
        ctx.queryRoot(node.range[1]);
    }
}
export function compile(node, ctx) {
    if (node.definitions.length) {
        ctx.createScope(
            () => {
                for (const definition of node.definitions) {
                    ctx.scope.awaitInit.add(definition.declarator.name);
                }

                ctx.put('(()=>{');
                ctx.list(node.definitions);
                ctx.put('return ');
                ctx.nodeOrCurrent(node.body);
                ctx.put('})()');
            },
            (scopeStart, sp) => {
                return scopeStart + sp + ';';
            },
            ctx.scope.$ref
        );
    } else if (node.body && node.body.type === 'Object') {
        ctx.put('(');
        ctx.nodeOrCurrent(node.body);
        ctx.put(')');
    } else {
        ctx.nodeOrCurrent(node.body);
    }
}
export function walk(node, ctx) {
    ctx.list(node.definitions);
    ctx.nodeOrNothing(node.body);
}
export function stringify(node, ctx) {
    ctx.list(node.definitions);
    ctx.nodeOrNothing(node.body);
}
