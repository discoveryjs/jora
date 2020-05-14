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

function valueSubset(ctx, values, extra) {
    if (extra.type === 'Array') {
        if (extra.elements.length === 0) {
            ctx.range([extra.range[0] + 1, extra.range[1] - 1], 'value-subset', values, extra);
        }

        for (const { type, range, value } of extra.elements) {
            if (range && (type === 'Literal' || type === 'Identifier' || (type === 'GetProperty' && value === null))) {
                ctx.range(range, 'value-subset', values, extra);
            }
        }
    }
}

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
                ctx.range(node.left.range, 'in-value', node.right, null);
                valueSubset(ctx, node.left, node.right);
                break;

            case 'not in':
                valueSubset(ctx, node.left, node.right);
                break;

            case 'has':
                ctx.range(node.right.range, 'in-value', node.left, null);
                valueSubset(ctx, node.right, node.left);
                break;

            case 'has no':
                valueSubset(ctx, node.right, node.left);
                break;

            case '=':
            case '!=':
                ctx.range(node.right.range, 'value', node.left, null);
                break;
        }
    },
    compile(node, ctx) {
        if (node.operator in binary === false) {
            ctx.error('Unknown operator "' + node.operator + '"', node);
            return;
        }

        if (node.operator === 'and' ||
            node.operator === 'not in' ||
            node.operator === 'has no') {
            ctx.put('!');
        }

        switch (node.operator) {
            case 'or':
            case 'and': {
                const tmpVar = ctx.allocateVar();

                ctx.put(`f.bool(${tmpVar}=`);
                ctx.node(node.left);
                ctx.put(`)?${tmpVar}:`);
                ctx.scope.captureCurrent.disabled = true;
                ctx.node(node.right);
                ctx.scope.captureCurrent.disabled = false;
                break;
            }

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
