export function compile(node, ctx) {
    const args = node.arguments.map(arg => ctx.unescapeName('$' + arg.name, arg));
    const duplicateNameNode = node.arguments.find((node, index) =>
        index > 0 && args.lastIndexOf('$' + node.name, index - 1) !== -1
    );

    if (duplicateNameNode) {
        ctx.error('Duplicate parameter name "$' + duplicateNameNode.name + '" is not allowed', duplicateNameNode);
    }

    // use function(){} since Arg1 refers to arguments[1],
    // but Function doesn't create 2nd argument implicitly to prevent function arity changes
    ctx.put('function(');
    ctx.put(String(args) || '$');
    ctx.put('){return ');
    ctx.createScope(
        () => {
            ctx.scope.arg1 = args[1] || 'arguments[1]';
            ctx.scope.$ref = args[0] || '$';

            for (const name of args) {
                ctx.scope.add(name);
            }

            ctx.node(node.body);
        },
        (sp) => sp + ','
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
