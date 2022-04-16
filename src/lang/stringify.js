import { stringify as nodes } from './nodes/index.js';

function isSimpleGetPropertyQuery(node) {
    if (node.type !== 'GetProperty') {
        return false;
    }

    return true;
}

function isSimpleMethodCallQuery(node) {
    if (node.type !== 'MethodCall') {
        return false;
    }

    return true;
}

export default function stringify(ast) {
    function walk(node) {
        if (nodes.has(node.type)) {
            nodes.get(node.type)(node, ctx);
        } else {
            throw new Error('Unknown node type "' + node.type + '"');
        }
    }

    const buffer = [];
    const ctx = {
        isSimpleGetPropertyQuery,
        isSimpleMethodCallQuery,
        put(chunk) {
            buffer.push(chunk);
        },
        node: walk,
        nodeOrNothing(node) {
            if (node !== null) {
                walk(node);
                return true;
            }
        },
        list(list, sep) {
            if (!sep) {
                list.forEach(walk);
                return;
            }

            list.forEach((element, idx) => {
                if (idx > 0) {
                    ctx.put(sep);
                }
                walk(element);
            });
        }
    };

    walk(ast);

    return buffer.join('');
};
