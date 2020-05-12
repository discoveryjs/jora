const binary = {
    'in': 'in',
    'not in': 'in',
    'has': '-',
    'has no': '-',
    'and': 'and',
    'or': 'or',
    '+': 'add',
    '-': 'sub',
    '*': 'mul',
    '/': 'div',
    '%': 'mod',
    '=': 'eq',
    '!=': 'ne',
    '<': 'lt',
    '<=': 'lte',
    '>': 'gt',
    '>=': 'gte',
    '~=': 'match'
};

module.exports = {
    build(operator, left, right) {
        return {
            type: 'Binary',
            operator,
            left,
            right
        };
    },
    suggest(node, ctx) {
        switch (node.operator) {
            case 'in':
                ctx.range(node.left.range, 'in-value', false, node.right);
                break;

            case 'has':
                ctx.range(node.right.range, 'in-value', false, node.left);
                break;

            case '=':
            case '!=':
                ctx.range(node.right.range, 'value', false, node.left);
                break;
        }
    },
    compile(node, ctx) {
        if (node.operator in binary === false) {
            throw new Error('Unknown operator `' + node.operator + '`');
        }

        if (node.operator === 'and' ||
            node.operator === 'not in' ||
            node.operator === 'has no') {
            ctx.put('!');
        }

        switch (node.operator) {
            case 'or':
            case 'and':
                ctx.needTmp = true;
                ctx.put('f.bool(tmp=');
                ctx.node(node.left);
                ctx.put(')?tmp:');
                ctx.scope.captureCurrent.disabled = true;
                ctx.node(node.right);
                ctx.scope.captureCurrent.disabled = false;
                break;

            case 'has':
            case 'has no':
                ctx.put('f.in(');
                ctx.node(node.right);
                ctx.put(',');
                ctx.node(node.left);
                ctx.put(')');
                break;

            default:
                ctx.put('f.');
                ctx.put(binary[node.operator]);
                ctx.put('(');
                ctx.node(node.left);
                ctx.put(',');
                ctx.node(node.right);
                ctx.put(')');
        }
    },
    walk(node, ctx) {
        ctx.node(node.left);
        ctx.node(node.right);
    },
    stringify(node, ctx) {
        ctx.node(node.left);

        if (/^[a-z]/i.test(node.operator)) {
            ctx.put(' ');
            ctx.put(node.operator);
            ctx.put(' ');
        } else {
            ctx.put(node.operator);
        }

        ctx.node(node.right);
    }
};
