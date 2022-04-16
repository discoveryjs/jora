import { walk as nodes } from './nodes/index.js';

export default function walk(ast, options) {
    function walk(node) {
        if (nodes.has(node.type)) {
            enter(node);
            nodes.get(node.type)(node, ctx);
            leave(node);
        } else {
            throw new Error('Unknown node type "' + node.type + '"');
        }
    }

    const ctx = {
        node: walk,
        nodeOrNothing(node) {
            if (node !== null) {
                walk(node);
            }
        },
        list(list) {
            list.forEach(walk);
        }
    };
    let enter = () => {};
    let leave = () => {};

    if (typeof options === 'function') {
        options = { enter: options };
    }

    if (options) {
        if (typeof options.enter === 'function') {
            enter = options.enter;
        }

        if (typeof options.leave === 'function') {
            leave = options.leave;
        }
    }

    walk(ast);
};
