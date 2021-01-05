const GetProperty = require('./GetProperty').build;
const Identifier = require('./Identifier').build;
const reservedVars = ['data', 'context', 'ctx', 'array', 'idx', 'index'];

function assertDeclaratorName(declarator, ctx) {
    if (ctx.scope.own.includes(declarator.name)) {
        ctx.error(`Identifier "$${declarator.name}" has already been declared`, declarator);
        return;
    }

    if (reservedVars.includes(declarator.name)) {
        ctx.error(`Identifier "$${declarator.name}" is reserved for future use`, declarator);
        return;
    }
}

module.exports = {
    build(declarator, value) {
        return {
            type: 'Definition',
            declarator,
            value
        };
    },
    suggest(node, ctx) {
        if (node.value === null) {
            ctx.range(node.declarator.range, 'path');
        }
    },
    compile(node, ctx) {
        if (node.declarator.name === null) {
            ctx.node(node.declarator);
            ctx.nodeOrCurrent(node.value);
            ctx.put(';');
            return;
        }

        assertDeclaratorName(node.declarator, ctx);

        ctx.put('const ');
        ctx.node(node.declarator);
        ctx.put('=');
        ctx.node(node.value || GetProperty(null, Identifier(node.declarator.name)));
        ctx.put(';');

        ctx.scope.push(node.declarator.name);
        ctx.scope.own.push(node.declarator.name);
    },
    interpret(node, ctx) {
        if (node.declarator.name !== null) {
            assertDeclaratorName(node.declarator, ctx);

            ctx.scope.own.push(node.declarator.name);
            ctx.scope.vars[node.declarator.name] = ctx.interpret(node.value);
        }
    },
    walk(node, ctx) {
        ctx.node(node.declarator);
        ctx.nodeOrNothing(node.value);
    },
    stringify(node, ctx) {
        ctx.node(node.declarator);

        if (node.value !== null) {
            ctx.put(':');
            ctx.node(node.value);
        }

        ctx.put(';');
    }
};
