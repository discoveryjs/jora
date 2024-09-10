export function compile(node, ctx) {
    ctx.put('($=>(');
    ctx.createScope(
        () => ctx.node(node.right),
        (sp) => sp + ','
    );
    ctx.put('))');
    ctx.put('(');
    ctx.nodeOrCurrent(node.left);
    ctx.put(')');
}
export function walk(node, ctx) {
    ctx.node(node.left);
    ctx.node(node.right);
}
export function stringify(node, ctx) {
    ctx.node(node.left);
    ctx.put('|');
    ctx.node(node.right);
}
