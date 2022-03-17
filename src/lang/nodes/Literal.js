export function compile(node, ctx) {
    ctx.put(typeof node.value === 'string' ? JSON.stringify(node.value) : String(node.value));
}
export function walk() { }
export function stringify(node, ctx) {
    ctx.put(
        typeof node.value === 'string'
            ? JSON.stringify(node.value)
            : String(node.value)
    );
}
