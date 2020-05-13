const createError = require('./error');
const nodes = require('./nodes').compile;

module.exports = function compile(ast, suggestions = null) {
    function addSuggestPoint(spName, start, end, type) {
        let from;

        if (type === 'var') {
            from = JSON.stringify(ctx.scope);
        } else {
            if (!spName) {
                spNames.push(spName = 's' + spNames.length);
            }
            from = spName;
        }

        if (from !== '[]') {
            normalizedSuggestRanges.push([from, JSON.stringify([start, end]), JSON.stringify(type)].join(','));
        }

        return spName;
    }

    function createScope(fn, defCurrent) {
        const prevScope = ctx.scope;
        const scopeStart = buffer.length;

        ctx.scope = ctx.scope.slice();
        ctx.scope.own = [];
        ctx.scope.firstCurrent = null;
        ctx.scope.captureCurrent = [];
        ctx.scope.arg1 = prevScope.arg1 || false;

        fn();

        if (ctx.scope.captureCurrent.length) {
            const spName = ctx.scope.captureCurrent.reduce(
                (spName, range) => addSuggestPoint(spName, ...range),
                undefined
            );
            const stat = 'stat(' + spName + ',current)';

            if (ctx.scope.firstCurrent) {
                buffer[ctx.scope.firstCurrent] = stat;
            } else {
                buffer[scopeStart] = defCurrent(buffer[scopeStart], stat);
            }
        }

        ctx.scope = prevScope;
    }

    function walk(node) {
        let spName = false;

        if (suggestions !== null) {
            if (suggestions.has(node)) {
                for (const [start, end, type, current] of suggestions.get(node)) {
                    if (type === 'var') {
                        addSuggestPoint(null, start, end, type);
                    } else if (current) {
                        ctx.scope.captureCurrent.push([start, end, type]);
                    } else {
                        const newSpName = addSuggestPoint(spName, start, end, type);

                        if (!spName) {
                            spName = newSpName;
                            put('stat(' + spName + ',');
                        }
                    }
                }
            }

            if (node.type === 'Current' &&
                ctx.scope.firstCurrent === null &&
                ctx.scope.captureCurrent.disabled !== true) {
                ctx.scope.firstCurrent = ctx.buffer.length;
            }
        }

        if (nodes.has(node.type)) {
            nodes.get(node.type)(node, ctx);
        } else {
            throw new Error('Unknown node type `' + node.type + '`');
        }

        if (spName) {
            put(')');
        }
    }

    const buffer = [
        'const current=data;',
        'return '
    ];
    const put = chunk => buffer.push(chunk);
    const normalizedSuggestRanges = [];
    const spNames = [];

    const ctx = {
        scope: [],
        createScope,
        buffer,  // FIXME: remove from ctx
        needTmp: false,
        put,
        node: walk,
        nodeOrNothing(node) {
            if (node) {
                walk(node);
            }
        },
        nodeOrCurrent(node, range) {
            if (node) {
                walk(node);
            } else {
                walk({ type: 'Current', range });
            }
        },
        list(list, sep) {
            list.forEach((element, idx) => {
                if (idx > 0) {
                    put(sep);
                }
                walk(element);
            });
        }
    };

    createScope(
        () => walk(ast),
        (scopeStart, sp) => {
            put(')');
            return '(' + sp + ',' + scopeStart;
        }
    );

    if (ctx.needTmp) {
        buffer.unshift('let tmp;');
    }

    if (suggestions !== null) {
        if (spNames.length > 0) {
            buffer.unshift('const ' + spNames.map(name => name + '=new Set()') + ';\n');
            buffer.unshift('const stat=(s,v)=>(s.add(v),v);\n');
        }
        put('\n,[' + normalizedSuggestRanges.map(s => '[' + s + ']') + ']');
    }

    try {
        return new Function('f', 'm', 'data', 'context', buffer.join(''));
    } catch (e) {
        const compiledSource = buffer.join('');
        const error = createError('SyntaxError', 'Jora query compilation error');

        error.compiledSource = compiledSource;

        throw error;
    }
};
