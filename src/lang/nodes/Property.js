const GetProperty = require('./GetProperty').build;
const Identifier = require('./Identifier').build;
const noBracketKeyType = new Set([
    'Literal',
    'Identifier',
    'Reference',
    'Current'
]);

module.exports = {
    build(key, value) {
        return {
            type: 'Property',
            key,
            value
        };
    },
    suggest(node, ctx) {
        if (node.value === null) {
            switch (node.key.type) {
                case 'Identifier':
                    ctx.range(node.range, 'path', true);
                    ctx.range(node.range, 'var', true);
                    break;

                case 'Current':
                case 'Reference':
                    ctx.range(node.range, 'var', true);
                    break;
            }
        }
    },
    compile(node, ctx) {
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
    },
    walk(node, ctx) {
        ctx.node(node.key);
        ctx.nodeOrNothing(node.value);
    },
    stringify(node, ctx) {
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
};
