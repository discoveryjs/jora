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

module.exports = function compile(ast, suggestRanges = [], statMode = false) {
    function addSuggestPoint(spName, range, type) {
        let from;

        if (type === 'var') {
            from = JSON.stringify(scope);
        } else {
            if (!spName) {
                spName = 'v' + (suggestAcc++);
            }
            from = spName;
        }

        if (from !== '[]') {
            normalizedSuggestRanges.push([from, JSON.stringify([range[0], range[1]]), JSON.stringify(type)].join(','));
        }

        return spName;
    }

    function addSuggestPointsFromRanges(ranges) {
        return ranges.reduce((spName, range) => {
            return addSuggestPoint(spName, range, range[2]) || spName;
        }, undefined);
    }

    function createScope(fn, defCurrent) {
        const prevScope = scope;
        const scopeStart = buffer.length;

        scope = scope.slice();
        scope.own = [];
        scope.firstCurrent = null;
        scope.captureCurrent = [];

        fn();

        if (scope.captureCurrent.length) {
            const spName = addSuggestPointsFromRanges(scope.captureCurrent);

            if (spName) {
                const stat = 'stat(' + spName + ',current)';
                if (scope.firstCurrent) {
                    buffer[scope.firstCurrent] = stat;
                } else {
                    buffer[scopeStart] = defCurrent(buffer[scopeStart], stat);
                }
            }
        }

        scope = prevScope;
    }

    function walk(node) {
        const collectStat = statMode && suggestNodes.has(node);

        if (collectStat) {
            const ranges = suggestNodes.get(node);
            const spName = addSuggestPointsFromRanges(ranges);

            if (spName) {
                put('stat(' + spName + ',');
            }

            suggestNodes.delete();
        }

        if (statMode && captureCurrent.has(node)) {
            scope.captureCurrent.push(...captureCurrent.get(node).filter(range => {
                if (range[2] === 'var') {
                    addSuggestPoint(null, range, range[2]);
                } else {
                    return true;
                }
            }));
        }

        switch (node.type) {
            case 'Data':
                put('data');
                break;

            case 'Context':
                put('context');
                break;

            case 'Current':
                if (scope.firstCurrent === null && !scope.captureCurrent.disabled) {
                    scope.firstCurrent = buffer.length;
                }
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
                    put('!f.bool(');
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
                        put('f.in(');
                        walk(node.right);
                        put(',');
                        walk(node.left);
                        put(')');
                        break;

                    case 'or':
                        needTmp = true;
                        put('f.bool(tmp=');
                        walk(node.left);
                        put(')?tmp:');
                        scope.captureCurrent.disabled = true;
                        walk(node.right);
                        scope.captureCurrent.disabled = false;
                        break;

                    case 'and':
                        needTmp = true;
                        put('f.bool(tmp=');
                        walk(node.left);
                        put(')?');
                        scope.captureCurrent.disabled = true;
                        walk(node.right);
                        scope.captureCurrent.disabled = false;
                        put(':tmp');
                        break;

                    default:
                        put('f.');
                        put(binary[node.operator]);
                        put('(');
                        walk(node.left);
                        put(',');
                        walk(node.right);
                        put(')');
                }
                break;

            case 'Conditional':
                put('f.bool(');
                walk(node.test);
                scope.captureCurrent.disabled = true;
                put(')?');
                walk(node.consequent);
                put(':');
                walk(node.alternate);
                scope.captureCurrent.disabled = false;
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

            case 'Function':
                createScope(
                    () => {
                        put('current=>(');
                        walk(node.body);
                        put(')');
                    },
                    (scopeStart, sp) => {
                        return scopeStart + sp + ',';
                    }
                );
                break;

            case 'Compare':
                if (node.order === 'desc') {
                    put('-');
                }
                createScope(
                    () => {
                        put('f.cmp((_q=current=>(');
                        walk(node.query);
                        put('))(a),_q(b))');
                    },
                    (scopeStart, sp) => {
                        return scopeStart + sp + ',';
                    }
                );
                break;

            case 'SortingFunction':
                put('(a, b)=>{let _q;return ');
                walkList(node.compares, '||');
                put('||0}');
                break;

            case 'MethodCall':
                put('m.');
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
                if (!node.name) {
                    break;
                }

                if (scope.own.includes(node.name.name)) {
                    throw new Error(`Identifier '$${node.name.name}' has already been declared`);
                }

                if (reservedVars.includes(node.name.name)) {
                    throw new Error(`Identifier '$${node.name.name}' is reserved for future use`);
                }

                put('const $');
                walk(node.name);
                put('=');
                walk(node.value);
                put(';');
                scope.push(node.name.name);
                scope.own.push(node.name.name);
                break;

            case 'Parentheses':
                put('(');
                walk(node.body);
                put(')');
                break;

            case 'Block':
                if (node.definitions.length) {
                    createScope(
                        () => {
                            put('(()=>{');
                            walkList(node.definitions);
                            put('return ');
                            walk(node.body);
                            put('})()');
                        },
                        (scopeStart, sp) => {
                            return scopeStart + sp + ';';
                        }
                    );
                } else if (node.body.type === 'Object') {
                    put('(');
                    walk(node.body);
                    put(')');
                } else {
                    walk(node.body);
                }
                break;

            case 'Reference':
                if (scope.includes(node.name.name)) {
                    put('$');
                    walk(node.name);
                } else {
                    put('typeof $');
                    walk(node.name);
                    put('!=="undefined"?$');
                    walk(node.name);
                    put(':undefined');
                }
                break;

            case 'Map':
                put('f.map(');
                walk(node.value);
                createScope(
                    () => {
                        put(',current=>');
                        walk(node.query);
                    },
                    (scopeStart, sp) => {
                        put(')');
                        return scopeStart + '(' + sp + ',';
                    }
                );
                put(')');
                break;

            case 'Filter':
                put('f.filter(');
                walk(node.value);
                createScope(
                    () => {
                        put(',current=>');
                        walk(node.query);
                    },
                    (scopeStart, sp) => {
                        put(')');
                        return scopeStart + '(' + sp + ',';
                    }
                );
                put(')');
                break;

            case 'Recursive':
                put('f.recursive(');
                walk(node.value);
                createScope(
                    () => {
                        put(',current=>');
                        walk(node.query);
                    },
                    (scopeStart, sp) => {
                        put(')');
                        return scopeStart + '(' + sp + ',';
                    }
                );
                put(')');
                break;

            case 'GetProperty':
                put('f.map(');
                walk(node.value);
                put(',');
                if (node.property.type === 'Identifier') {
                    put(JSON.stringify(node.property.name));
                } else {
                    walk(node.property);
                }
                put(')');
                break;

            case 'SliceNotation':
                put('f.slice(');
                walk(node.value);
                node.arguments.slice(0, 3).forEach(item => {
                    put(',');
                    item ? walk(item) : put('undefined');
                });
                put(')');
                break;

            case 'Pipeline':
                put('(current=>(');
                walk(node.right);
                put('))(');
                walk(node.left);
                put(')');
                break;
        }

        if (collectStat) {
            put(')');
        }
    }

    const reservedVars = ['data', 'context', 'ctx', 'array', 'idx', 'index'];
    let scope = [];
    let needTmp = false;
    const buffer = [
        'const current=data;',
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
    const captureCurrent = suggestRanges.reduce((map, range) => {
        if (range[3] === 'current') {
            if (map.has(range[4])) {
                map.get(range[4]).push(range);
            } else {
                map.set(range[4], [range]);
            }
        }
        return map;
    }, new Map());
    const suggestNodes = suggestRanges.reduce((map, range) => {
        if (range[3] && range[3] !== 'current') {
            if (map.has(range[3])) {
                map.get(range[3]).push(range);
            } else {
                map.set(range[3], [range]);
            }
        }
        return map;
    }, new Map());
    let suggestAcc = 0;
    const normalizedSuggestRanges = [];

    createScope(
        () => walk(ast),
        (scopeStart, sp) => {
            put(')');
            return scopeStart + '(' + sp + ',';
        }
    );

    if (needTmp) {
        buffer.unshift('let tmp;');
    }

    if (statMode) {
        if (suggestAcc > 0) {
            buffer.unshift('const ' + Array.from(Array(suggestAcc), (_, i) => 'v' + i + '=new Set()') + ';\n');
            buffer.unshift('const stat=(values,v)=>(values.add(v),v);\n');
        }
        put('\n,[' + normalizedSuggestRanges.map(s => '[' + s + ']') + ']');
    }

    try {
        return new Function('f', 'm', 'data', 'context', buffer.join(''));
    } catch (e) {
        console.error('Query compile error:', buffer.join(''));
        throw e;
    }
};
