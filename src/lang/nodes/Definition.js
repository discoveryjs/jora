import { GetProperty, Identifier } from '../build.js';

const reservedVars = ['data', 'context', 'ctx', 'array', 'idx', 'index'];

export function suggest(node, ctx) {
    if (node.value === null) {
        ctx.range(node.declarator.range, 'path');
    }
}
export function compile(node, ctx) {
    if (node.declarator.name === null) {
        ctx.node(node.declarator);
        ctx.nodeOrCurrent(node.value);
        ctx.put(';');
        return;
    }

    if (ctx.scope.own.includes(node.declarator.name)) {
        ctx.error(`Identifier "$${node.declarator.name}" has already been declared`, node.declarator);
        return;
    }

    if (reservedVars.includes(node.declarator.name)) {
        ctx.error(`Identifier "$${node.declarator.name}" is reserved for future use`, node.declarator);
        return;
    }

    ctx.put('const ');
    ctx.node(node.declarator);
    ctx.put('=');
    ctx.node(node.value || GetProperty(null, Identifier(node.declarator.name)));
    ctx.put(';');

    ctx.scope.push(node.declarator.name);
    ctx.scope.own.push(node.declarator.name);
}
export function walk(node, ctx) {
    ctx.node(node.declarator);
    ctx.nodeOrNothing(node.value);
}
export function stringify(node, ctx) {
    ctx.node(node.declarator);

    if (node.value !== null) {
        ctx.put(':');
        ctx.node(node.value);
    }

    ctx.put(';');
}
