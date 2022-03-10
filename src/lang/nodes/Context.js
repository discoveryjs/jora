export function build() {
    return {
        type: 'Context'
    };
}
export function compile(node, ctx) {
    ctx.put('context');
}
export function walk() { }
export function stringify(node, ctx) {
    ctx.put('#');
}
