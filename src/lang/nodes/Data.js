export function build() {
    return {
        type: 'Data'
    };
}
export function compile(node, ctx) {
    ctx.put('data');
}
export function walk() { }
export function stringify(node, ctx) {
    ctx.put('@');
}
