export function compile(node, ctx) {
    const arg1 = ctx.scope.arg1;
    ctx.put(typeof arg1 === 'string' ? arg1 : 'undefined');
}
export function walk() { }
export function stringify(node, ctx) {
    ctx.put('$$');
}
