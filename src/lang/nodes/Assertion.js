export function suggest(node, ctx) {
    if (!Array.isArray(node.assertion)) {
        ctx.range(node.assertion.range, 'var');
        ctx.range(node.assertion.range, 'assertion');
    }
}
export function compile(node, ctx) {
    if (Array.isArray(node.assertion)) {
        ctx.put(node.negation ? '!(' : '(');
        ctx.list(node.assertion, '||');
        ctx.put(')');
    } else {
        if (node.negation) {
            ctx.put('!');
        }

        switch (node.assertion.type) {
            case 'Identifier':
                if (node.assertion.name) {
                    if (ctx.tolerant) {
                        ctx.put('(typeof ');
                    }

                    ctx.put('a.');
                    ctx.put(node.assertion.name);

                    if (ctx.tolerant) {
                        ctx.put('==="function"?a.');
                        ctx.put(node.assertion.name);
                    }

                    ctx.put('(');
                    ctx.nodeOrCurrent();
                    ctx.put(')');

                    if (ctx.tolerant) {
                        ctx.put(':false)');
                    }

                    if (ctx.usedAssertions.has(node.assertion.name)) {
                        ctx.usedAssertions.get(node.assertion.name).push(node.assertion.range);
                    } else {
                        ctx.usedAssertions.set(node.assertion.name, node.assertion.range);
                    }
                } else {
                    ctx.put('false');
                }

                break;

            case 'Method':
                ctx.node(node.assertion);
                break;

            default:
                ctx.error('Unknown assertion node type "' + node.assertion.type + '"', node.assertion);
        }
    }
}
export function walk(node, ctx) {
    if (Array.isArray(node.assertion)) {
        ctx.list(node.assertion);
    } else {
        ctx.node(node.assertion);
    }
}
export function stringify(node, ctx) {
    if (node.negation) {
        ctx.put('not ');
    }

    if (Array.isArray(node.assertion)) {
        ctx.put('(');
        ctx.list(node.assertion, ',');
        ctx.put(')');
    } else {
        ctx.node(node.assertion);
    }
}
