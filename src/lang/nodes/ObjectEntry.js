import { GetProperty, Identifier } from '../build.js';

const noBracketKeyType = new Set([
    'Literal',
    'Identifier',
    'Reference',
    'Current'
]);

export function suggest(node, ctx) {
    if (node.value === null) {
        switch (node.key.type) {
            case 'Identifier':
                ctx.range(node.range, 'path');
                ctx.range(node.range, 'var');
                break;

            case 'Current':
            case 'Reference':
                ctx.range(node.range, 'var');
                break;
        }
    }
}
export function compile(node, ctx) {
    let value = node.value;

    switch (node.key.type) {
        case 'Current':
            return;

        case 'Literal':
            ctx.node(node.key);
            break;

        case 'Identifier':
            ctx.node(node.key);
            value = value || GetProperty(null, Identifier(node.key.name));
            break;

        case 'Reference':
            ctx.node(node.key.name);
            value = value || node.key;
            break;

        default:
            ctx.put('[');
            ctx.node(node.key);
            ctx.put(']');
    }

    ctx.put(':');
    ctx.node(value);
}
export function walk(node, ctx) {
    ctx.node(node.key);
    ctx.nodeOrNothing(node.value);
}
export function stringify(node, ctx) {
    if (noBracketKeyType.has(node.key.type)) {
        ctx.node(node.key);

        if (node.value === null) {
            return;
        }
    } else {
        ctx.put('[');
        ctx.node(node.key);
        ctx.put(']');
    }

    ctx.put(':');
    ctx.node(node.value);
}
