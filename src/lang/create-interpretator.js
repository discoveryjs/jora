const nodes = require('./nodes').interpret;

module.exports = function createInterpretator(ast, tolerant = false, suggestions = null) {
    // console.log('interpret', ast);
    return function(buildin, methods, data, context) {
        const ctx = {
            tolerant,
            buildin,
            methods,
            data,
            context,
            scope: null,
            runInScope(current, fn) {
                const prevScope = this.scope;

                this.scope = {
                    vars: Object.create(prevScope),
                    own: [],
                    current: current
                };

                try {
                    return fn();
                } finally {
                    this.scope = prevScope;
                }
            },
            interpret(node) {
                return nodes.get(node.type)(node, ctx);
            },
            nodeOrCurrent(node) {
                return node || { type: 'Current' };
            },
            error(message, node) {
                const error = new SyntaxError(message);

                if (node && node.range) {
                    error.details = {
                        loc: {
                            range: node.range
                        }
                    };
                }

                if (!tolerant) {
                    throw error;
                }
            }
        };

        return ctx.runInScope(data, () => ctx.interpret(ast));
    };
};
