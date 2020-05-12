const nodes = require('./nodes').stringify;

function isSimpleGetPropertyQuery(node) {
    if (node.type !== 'GetProperty') {
        return false;
    }

    if (node.value && node.value.type !== 'Current') {
        return false;
    }

    if (node.property.type !== 'Identifier') {
        return false;
    }

    return true;
}

function isSimpleMethodCallQuery(node) {
    if (node.type !== 'MethodCall') {
        return false;
    }

    if (node.value && node.value.type !== 'Current') {
        return false;
    }

    return true;
}

function isSameIdentifierAndReference(reference, ident) {
    if (ident.type !== 'Identifier') {
        return false;
    }

    if (reference.type !== 'Reference' || reference.name.type !== 'Identifier') {
        return false;
    }

    return ident.name === reference.name.name;
}

function isGetProperty(query, property) {
    if (!isSimpleGetPropertyQuery(query)) {
        return false;
    }

    return query.property.name === property;
}

module.exports = function stringify(ast) {
    function walk(node) {
        if (nodes.has(node.type)) {
            nodes.get(node.type)(node, ctx);
        } else {
            throw new Error('Unknown node type `' + node.type + '`');
        }
    }

    const buffer = [];
    const ctx = {
        isSimpleGetPropertyQuery,
        isSimpleMethodCallQuery,
        isSameIdentifierAndReference,
        isGetProperty,
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

    walk(ast, ctx);

    return buffer.join('');
};
