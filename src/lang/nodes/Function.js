export function compile(node, ctx) {
    const args = node.arguments.map(arg => '$' + arg.name);

    // use function(){} since Arg1 refers to arguments[1],
    // but Function doesn't create 2nd argument implicitly to prevent function arity changes
    ctx.put('function(');
    ctx.put(String(args) || '$');

    ctx.createScope(
        () => {
            ctx.scope.arg1 = true;
            ctx.scope.$ref = args[0] || '$';

            for (const arg of node.arguments) {
                ctx.scope.add(arg.name);
            }

            ctx.put('){return ');
            ctx.node(node.body);
        },
        (scopeStart, sp) => {
            return scopeStart + sp + ',';
        }
    );

    ctx.put('}');
}
export function walk(node, ctx) {
    ctx.node(node.body);
}
export function stringify(node, ctx) {
    ctx.put('=>');
    ctx.node(node.body);
}
