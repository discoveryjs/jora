const binary = {
    'in': 'in',
    'not in': 'notIn',
    'has': 'has',
    'has no': 'hasNo',
    'and': 'and',
    'or': 'or',
    '??': 'nullish',
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

function valueSubset(ctx, values, dict) {
    if (dict.type === 'Array') {
        if (dict.elements.length === 0) {
            ctx.range([dict.range[0] + 1, dict.range[1] - 1], 'value-subset', values, false);
            return;
        }

        const excludeValues = [];
        for (const { type, range, value } of dict.elements) {
            if (range && (type === 'Literal' || type === 'Identifier')) {
                excludeValues.push(value);
            }
        }

        const related = excludeValues.length ? ctx.literalList(excludeValues) : false;
        for (const { type, range, value } of dict.elements) {
            if (range) {
                if (type === 'Literal' || type === 'Identifier' || (type === 'GetProperty' && value === null)) {
                    ctx.range(range, 'value-subset', values, related);
                }
            }
        }
    }
}

export function suggest(node, ctx) {
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
}
export function compile(node, ctx) {
    if (node.operator in binary === false) {
        ctx.error('Unknown operator "' + node.operator + '"', node);
        return;
    }

    switch (node.operator) {
        // separate branch since node.right might not to be evaluated (short-circuiting) when:
        // - node.left is falsy for "and"
        // - node.left is truthy for "or"
        case 'and':
            ctx.put('!');
        case 'or': {
            const tmpVar = ctx.allocateVar();

            ctx.put(`${ctx.buildinFn('bool')}(${tmpVar}=`);
            ctx.node(node.left);
            ctx.put(`)?${tmpVar}:`);
            ctx.scope.captureCurrent.disabled = true;
            ctx.node(node.right);
            ctx.scope.captureCurrent.disabled = false;
            break;
        }

        // separate branch since node.right might not to be evaluated (short-circuiting)
        // when node.left is null or undefined
        case '??': {
            const tmpVar = ctx.allocateVar();

            ctx.put(`(${tmpVar}=`);
            ctx.node(node.left);
            ctx.put(`,${tmpVar}!==null&&${tmpVar}!==undefined)?${tmpVar}:`);
            ctx.scope.captureCurrent.disabled = true;
            ctx.node(node.right);
            ctx.scope.captureCurrent.disabled = false;
            break;
        }

        // separate branch since suggest should collect stat for node.right first
        case 'has no':
            ctx.put('!');
        case 'has':
            ctx.put(ctx.buildinFn('in'));
            ctx.put('(');
            ctx.node(node.right);
            ctx.put(',');
            ctx.node(node.left);
            ctx.put(')');
            break;

        default:
            ctx.put(ctx.buildinFn(binary[node.operator]));
            ctx.put('(');
            ctx.node(node.left);
            ctx.put(',');
            ctx.node(node.right);
            ctx.put(')');
    }
}
export function walk(node, ctx) {
    ctx.node(node.left);
    ctx.node(node.right);
}
export function stringify(node, ctx) {
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
