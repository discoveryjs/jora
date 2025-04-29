import { GetProperty, Identifier } from '../build.js';

const reservedVars = ['$data', '$context', '$ctx', '$array', '$idx', '$index'];

export function suggest(node, ctx) {
    if (node.value === null) {
        ctx.range(node.declarator.range, 'path');
    }
}
export function compile(node, ctx) {
    const name = node.declarator.name;
    const unescapedName = name && ctx.unescapeName('$' + name, node);

    if (unescapedName === null) {
        ctx.node(node.declarator);
        ctx.nodeOrCurrent(node.value);
        ctx.put(';');
        return;
    }

    if (ctx.scope.own.has(unescapedName)) {
        ctx.error(`Identifier "${unescapedName}" has already been declared`, node.declarator);
        return;
    }

    if (reservedVars.includes(unescapedName)) {
        ctx.error(`Identifier "${unescapedName}" is reserved for future use`, node.declarator);
        return;
    }

    ctx.put('const ');
    ctx.node(node.declarator);
    ctx.put('=');
    ctx.node(node.value || GetProperty(null, Identifier(name))); // must be original name
    ctx.put(';');

    ctx.scope.add(unescapedName);
    ctx.scope.own.add(unescapedName);
    ctx.scope.awaitInit.delete(unescapedName);
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
