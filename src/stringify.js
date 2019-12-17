function isSameIdentifierAndReference(ident, reference) {
    if (ident.type !== 'Identifier') {
        return false;
    }

    if (reference.type !== 'Reference' || reference.name.type !== 'Identifier') {
        return false;
    }

    return ident.name === reference.name.name;
}

function isGetProperty(node, property) {
    if (node.type !== 'GetProperty') {
        return false;
    }

    if (node.value.type !== 'Current') {
        return false;
    }

    if (node.property.type !== 'Identifier') {
        return false;
    }

    return node.property.name === property;
}

module.exports = function stringify(ast) {
    function walk(node) {
        switch (node.type) {
            case 'Data':
                put('@');
                break;

            case 'Context':
                put('#');
                break;

            case 'Current':
                put('$');
                break;

            case 'Literal':
                put(typeof node.value === 'string' ? JSON.stringify(node.value) : String(node.value));
                break;

            case 'Identifier':
                put(node.name);
                break;

            case 'Unary':
                put(node.operator);
                if (node.operator !== '-' && node.operator !== '+') {
                    put(' ');
                }
                walk(node.argument);
                break;

            case 'Binary':
                walk(node.left);
                if (/^[a-z]/i.test(node.operator)) {
                    put(' ');
                    put(node.operator);
                    put(' ');
                } else {
                    put(node.operator);
                }
                walk(node.right);
                break;

            case 'Conditional':
                walk(node.test);
                put('?');
                walk(node.consequent);
                put(':');
                walk(node.alternate);
                break;

            case 'Object':
                put('{');
                stringifyList(node.properties, ',');
                put('}');
                break;

            case 'Property':
                // $ -> $
                // foo: $foo -> $foo
                if (!node.key || isSameIdentifierAndReference(node.key, node.value)) {
                    walk(node.value);
                    break;
                }

                if (node.key.type === 'Literal' || node.key.type === 'Identifier') {
                    walk(node.key);
                } else {
                    put('[');
                    walk(node.key);
                    put(']');
                }

                if (node.key.type !== 'Identifier' || !isGetProperty(node.value, node.key.name)) {
                    put(':');
                    walk(node.value);
                }
                break;

            case 'Spread':
                put('...');
                walkIfNotCurrent(node.query);
                break;

            case 'Array':
                put('[');
                stringifyList(node.elements, ',');
                put(']');
                break;

            case 'Function':
                put('<');
                walk(node.body);
                put('>');
                break;

            case 'Compare':
                walk(node.query);
                put(node.reverse ? ' desc' : ' asc');
                break;

            case 'SortingFunction':
                stringifyList(node.compares, ',');
                break;

            case 'MethodCall':
                walkIfNotCurrent(node.value) && put('.');
                walk(node.method);
                put('(');
                stringifyList(node.arguments, ',');
                put(')');
                break;

            case 'Definition':
                if (!node.name) {
                    walk(node.value);
                } else {
                    put('$');
                    walk(node.name);
                    if (node.name.type !== 'Identifier' || !isGetProperty(node.value, node.name.name)) {
                        put(':');
                        walk(node.value);
                    }
                }
                put(';');
                break;

            case 'Parentheses':
                put('(');
                walk(node.body);
                put(')');
                break;

            case 'Block':
                node.definitions.forEach(walk);
                walk(node.body);
                break;

            case 'Reference':
                put('$');
                walk(node.name);
                break;

            case 'Map':
                walkIfNotCurrent(node.value);
                put('.(');
                walk(node.query);
                put(')');
                break;

            case 'Filter':
                walkIfNotCurrent(node.value);
                put('.[');
                walk(node.query);
                put(']');
                break;

            case 'Recursive':
                walkIfNotCurrent(node.value);
                put('..(');
                walk(node.query);
                put(')');
                break;

            case 'GetProperty':
                if (node.property.type === 'Identifier') {
                    walkIfNotCurrent(node.value) && put('.');
                    walk(node.property);
                } else {
                    walk(node.value);
                    put('[');
                    walk(node.property);
                    put(']');
                }
                break;

            case 'SliceNotation': {
                const [a, b, c] = node.arguments;

                walkIfNotCurrent(node.value);
                put('[');
                if (a) {
                    walk(a);
                }
                put(':');
                if (b) {
                    walk(b);
                }
                if (c) {
                    put(':');
                    walk(c);
                }
                put(']');
                break;
            }

            default:
                throw new Error('Unknown node type `' + node.type + '`');
        }
    }

    const buffer = [];
    const put = chunk => buffer.push(chunk);
    const walkIfNotCurrent = node => {
        if (node.type !== 'Current') {
            walk(node);
            return true;
        }
    };
    const stringifyList = (list, sep) => {
        list.forEach((element, idx) => {
            if (idx > 0) {
                put(sep);
            }
            walk(element);
        });
    };

    walk(ast);

    return buffer.join('');
};
