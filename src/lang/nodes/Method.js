module.exports = {
    build(reference, args) {
        return {
            type: 'Method',
            reference,
            arguments: args
        };
    },
    suggest(node, ctx) {
        if (node.arguments.length === 0) {
            ctx.queryRoot(node.range[1] - 1);
        }
    },
    compile(node, ctx, relatedNode) {
        //  default mode: method(relatedNode, ...args...)
        // tolerant mode: (typeof method === 'function' ? method(relatedNode, ...args...) : undefined)
        if (ctx.tolerant) {
            ctx.put('(typeof ');
        }

        if (node.reference.type === 'Identifier') {
            ctx.put('m.');
        }

        ctx.node(node.reference);

        if (ctx.tolerant) {
            ctx.put('==="function"?');

            if (node.reference.type === 'Identifier') {
                ctx.put('m.');
            }

            ctx.node(node.reference);
        }

        ctx.put('(');
        ctx.nodeOrCurrent(relatedNode);

        if (node.arguments.length) {
            ctx.put(',');
            ctx.list(node.arguments, ',');
        }

        ctx.put(')');

        if (ctx.tolerant) {
            ctx.put(':undefined)');
        }
    },
    interpret(node, ctx) {
        const methodRef = ctx.interpret(node.reference);
        const method = typeof methodRef === 'string' ? ctx.methods[methodRef] : methodRef;
        const args = node.arguments.map(ctx.interpret);

        return function(current) {
            return method(current, ...args);
        };
    },
    walk(node, ctx) {
        ctx.node(node.reference);
        ctx.list(node.arguments);
    },
    stringify(node, ctx) {
        ctx.node(node.reference);
        ctx.put('(');
        ctx.list(node.arguments, ',');
        ctx.put(')');
    }
};
