module.exports = {
    build(value) {
        return {
            type: 'Literal',
            value
        };
    },
    compile(node, ctx) {
        ctx.put(typeof node.value === 'string' ? JSON.stringify(node.value) : String(node.value));
    },
    walk() {},
    stringify(node, ctx) {
        ctx.put(
            typeof node.value === 'string'
                ? JSON.stringify(node.value)
                : String(node.value)
        );
    }
};
