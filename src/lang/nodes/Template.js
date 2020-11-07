module.exports = {
    build(values) {
        return {
            type: 'Template',
            values
        };
    },
    suggest(node, ctx) {
        for (const [idx, v] of Object.entries(node.values)) {
            if (v === null) {
                ctx.queryRoot(node.values[idx - 1].range[1]);
            }
        }
    },
    compile(node, ctx) {
        for (const [idx, v] of Object.entries(node.values)) {
            if (v === null) {
                continue;
            }

            if (idx !== '0') {
                ctx.put('+');
            }

            if (idx % 2 === 0) {
                ctx.put('"' + encodeString(v.value, compileEscape) + '"');
            } else {
                ctx.put('(');
                ctx.node(v);
                ctx.put(')');
            }
        }
    },
    walk(node, ctx) {
        for (const v of node.values) {
            if (v !== null) {
                ctx.node(v);
            }
        }
    },
    stringify(node, ctx) {
        const lastIdx = String(node.values.length - 1);

        for (const [idx, v] of Object.entries(node.values)) {
            if (idx % 2 === 0) {
                ctx.put(idx === '0' ? '`' : '}');
                ctx.put(encodeString(v.value, stringifyEscape));
                ctx.put(idx === lastIdx ? '`' : '${');
            } else if (v !== null) {
                ctx.node(v);
            }
        }
    }
};

const compileEscape = new Map([
    ['\b', '\\b'],
    ['\n', '\\n'],
    ['\r', '\\r'],
    ['\f', '\\f'],
    ['\t', '\\t'],
    ['\v', '\\v'],
    ['\u2028', '\\u2028'],
    ['\u2029', '\\u2029'],
    ['\\', '\\\\'],
    ['"', '\\"']
]);
const stringifyEscape = new Map([
    ['\b', '\\b'],
    ['\f', '\\f'],
    ['\t', '\\t'],
    ['\v', '\\v'],
    ['\\', '\\\\'],
    ['$', '\\$']
]);
function encodeString(s, map) {
    let result = '';

    for (let i = 0; i < s.length; i++) {
        result += map.get(s[i]) || s[i];
    }

    return result;
}
