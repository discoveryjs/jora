export function compile(node, ctx) {
    if (node.name) {
        ctx.putIdent('$' + ctx.unescapeName(node.name, node), node);
    }
}
export function walk() { }
export function stringify(node, ctx) {
    ctx.put(node.name ? '$' + node.name : '$');
}
