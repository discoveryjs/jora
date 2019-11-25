function def(name, value) {
    return `const ${name} = ${value};`;
}

const unary = {
    '-': '-',
    '+': '+',
    'no': '!',
    'not': '!'
};

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

module.exports = function compile(ast, commentRanges, statMode) {
    function walk(node) {
        switch (node.type) {
            case 'Data':
                put('data');
                break;

            case 'Context':
                put('context');
                break;

            case 'Current':
                put('current');
                break;

            case 'Literal':
                put(typeof node.value === 'string' ? JSON.stringify(node.value) : String(node.value));
                break;

            case 'Identifier':
                put(node.name);
                break;

            case 'Unary':
                if (node.operator in unary === false) {
                    throw new Error('Unknown operator `' + node.operator + '`');
                }

                if (node.operator === 'not' || node.operator === 'no') {
                    put('!fn.bool(');
                    walk(node.argument);
                    put(')');
                } else {
                    put(unary[node.operator]);
                    walk(node.argument);
                }
                break;

            case 'Binary':
                if (node.operator in binary === false) {
                    throw new Error('Unknown operator `' + node.operator + '`');
                }

                if (node.operator === 'not in' || node.operator === 'has no') {
                    put('!');
                }

                switch (node.operator) {
                    case 'has':
                    case 'has no':
                        put('fn.in(');
                        walk(node.right);
                        put(',');
                        walk(node.left);
                        put(')');
                        break;

                    case 'or':
                        put('fn.bool(tmp=');
                        walk(node.left);
                        put(')?tmp:');
                        walk(node.right);
                        break;

                    case 'and':
                        put('fn.bool(tmp=');
                        walk(node.left);
                        put(')?');
                        walk(node.right);
                        put(':tmp');
                        break;

                    default:
                        put('fn.');
                        put(binary[node.operator]);
                        put('(');
                        walk(node.left);
                        put(',');
                        walk(node.right);
                        put(')');
                }
                break;

            case 'Conditional':
                put('fn.bool(');
                walk(node.test);
                put(')?');
                walk(node.consequent);
                put(':');
                walk(node.alternate);
                break;

            case 'Object':
                put('{');
                walkList(node.properties, ',');
                put('}');
                break;

            case 'Property':
                if (!node.key) {
                    break;
                }

                if (node.key.type === 'Literal' || node.key.type === 'Identifier') {
                    walk(node.key);
                } else {
                    put('[');
                    walk(node.key);
                    put(']');
                }
                put(':');
                walk(node.value);
                break;

            case 'Spread':
                put('...');
                walk(node.query);
                break;

            case 'Array':
                put('[');
                walkList(node.elements, ',');
                put(']');
                break;

            case 'Function': {
                const prevScope = scope.slice();

                put('current=>');
                walk(node.body);

                scope = prevScope;
                break;
            }

            case 'Compare':
                if (node.reverse) {
                    put('-');
                }
                put('fn.cmp((_q=current=>');
                walk(node.query);
                put(')(a),_q(b))');
                break;

            case 'SortingFunction':
                put('(a, b)=>{let _q;return ');
                walkList(node.compares, '||');
                put('||0}');
                break;

            case 'MethodCall':
                put('method.');
                walk(node.method);
                put('(');
                walk(node.value);
                if (node.arguments.length) {
                    put(',');
                    walkList(node.arguments, ',');
                }
                put(')');
                break;

            case 'Definition':
                if (scope.includes(node.name.name)) {
                    throw new Error(`Identifier '$${node.name.name}' has already been declared`);
                }

                put('const $');
                walk(node.name);
                put('=');
                walk(node.value);
                put(';');
                scope.push(node.name.name);
                break;

            case 'Parentheses':
                put('(');
                walk(node.body);
                put(')');
                break;

            case 'Block':
                const prevScope = scope.slice();

                put('(()=>{');
                walkList(node.definitions);
                put('return ');
                walk(node.body);
                put('})()');

                scope = prevScope;
                break;

            case 'Reference':
                if (scope.includes(node.name.name)) {
                    put('$');
                    walk(node.name);
                } else {
                    put('/*bad ref: $');
                    walk(node.name);
                    put('*/undefined');
                }
                break;

            case 'Map':
                put('fn.map(');
                walk(node.value);
                put(',current=>');
                walk(node.query);
                put(')');
                break;

            case 'Filter':
                put('fn.filter(');
                walk(node.value);
                put(',current=>');
                walk(node.query);
                put(')');
                break;

            case 'Recursive':
                put('fn.recursive(');
                walk(node.value);
                put(',current=>');
                walk(node.query);
                put(')');
                break;

            case 'GetProperty':
                // ranges.push([scope.slice(), node.value.range, 'var']);
                // console.log(node.value);

                put('fn.map(');
                walk(node.value);
                put(',');
                if (node.property.type === 'Identifier') {
                    put(JSON.stringify(node.property.name));
                } else {
                    walk(node.property);
                }
                put(')');
                break;

            case 'SelfCall':
                if (!node.value) {
                    put('current=>self(current,context)');
                    break;
                }

                if (node.value.type === 'Current') {
                    put('self(current,context)');
                } else {
                    put('self(');
                    walk(node.value);
                    put(')');
                }
                break;
        }
    }

    let scope = ['data', 'context', 'ctx', 'array', 'idx', 'index'];
    // const suggestPoints = [];
    const ranges = [];
    const buffer = [
        def('current', 'data'),
        ...scope.map(name => def('$' + name)),
        'let tmp;',
        'return '
    ];
    const put = chunk => buffer.push(chunk);
    const walkList = (list, sep) => {
        list.forEach((element, idx) => {
            if (idx > 0) {
                put(sep);
            }
            walk(element);
        });
    };

    walk(ast);

    if (statMode) {
        put(',' + JSON.stringify(ranges));
    }

    return new Function('fn', 'method', 'data', 'context', 'self', buffer.join(''));
};
