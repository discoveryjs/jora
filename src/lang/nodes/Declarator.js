export function compile(node, ctx) {
    if (node.name) {
        ctx.put('$' + node.name);
    }
}
export function walk() { }
export function stringify(node, ctx) {
    ctx.put(node.name ? '$' + node.name : '$');
}
