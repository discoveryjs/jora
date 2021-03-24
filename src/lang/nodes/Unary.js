module.exports = {
    build(operator, argument) {
        return {
            type: 'Unary',
            operator,
            argument
        };
    },
    compile(node, ctx) {
        switch (node.operator) {
            case 'no':
            case 'not':
                ctx.put('!f.bool(');
                ctx.node(node.argument);
                ctx.put(')');
                break;

            case '+':
            case '-':
                ctx.put(node.operator);
                ctx.node(node.argument);
                break;

            default:
                ctx.error('Unknown operator "' + node.operator + '"', node);
        }
    },
    interpret(node, ctx) {
        switch (node.operator) {
            case 'no':
            case 'not':
                return !ctx.buildin.bool(ctx.interpret(node.argument));

            case '+':
                return +ctx.interpret(node.argument);

            case '-':
                return -ctx.interpret(node.argument);

            default: {
                ctx.error('Unknown operator "' + node.operator + '"', node);
            }
        }
    },
    walk(node, ctx) {
        ctx.node(node.argument);
    },
    stringify(node, ctx) {
        ctx.put(node.operator);

        if (node.operator !== '-' && node.operator !== '+') {
            ctx.put(' ');
        }

        ctx.node(node.argument);
    }
};
