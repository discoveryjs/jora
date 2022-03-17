export function compile(node, ctx) {
    ctx.put(ctx.scope.arg1 ? 'arguments[1]' : 'undefined');
}
export function walk() { }
export function stringify(node, ctx) {
    ctx.put('$$');
}
