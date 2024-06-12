export function compile(node, ctx) {
    ctx.createScope(
        () => {
            const args = node.arguments.map(arg => '$' + arg.name);

            ctx.scope.arg1 = true;
            ctx.scope.$ref = args[0] || '$';

            for (const arg of node.arguments) {
                ctx.scope.add(arg.name);
            }

            ctx.put('function(');
            ctx.put(String(args) || '$');
            ctx.put('){return ');
            ctx.node(node.body);
            ctx.put('}');
        },
        (scopeStart, sp) => {
            return scopeStart + sp + ',';
        }
    );
}
export function walk(node, ctx) {
    ctx.node(node.body);
}
export function stringify(node, ctx) {
    ctx.put('=>');
    ctx.node(node.body);
}
