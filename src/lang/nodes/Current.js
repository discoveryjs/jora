export function suggest(node, ctx) {
    if (node.range) {
        ctx.range(node.range, 'var');
    }
}
export function compile(node, ctx) {
    ctx.put('$');
}
export function walk() { }
export function stringify(node, ctx) {
    ctx.put('$');
}
