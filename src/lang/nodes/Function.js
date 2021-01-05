module.exports = {
    build(args, body, legacy) {
        return {
            type: 'Function',
            arguments: args,
            body,
            legacy: Boolean(legacy)
        };
    },
    compile(node, ctx) {
        ctx.createScope(
            () => {
                ctx.scope.arg1 = true;
                ctx.put('function(current){return ');
                ctx.node(node.body);
                ctx.put('}');
            },
            (scopeStart, sp) => {
                return scopeStart + sp + ',';
            }
        );
    },
    interpret(node, ctx) {
        return function(current) {
            return ctx.runInScope(current, () => ctx.interpret(node.body));
        };
    },
    walk(node, ctx) {
        ctx.node(node.body);
    },
    stringify(node, ctx) {
        if (node.legacy) {
            ctx.put('<');
            ctx.node(node.body);
            ctx.put('>');
        } else {
            ctx.put('=>');
            ctx.node(node.body);
        }
    }
};
