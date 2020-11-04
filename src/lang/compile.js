const createError = require('./error');
const nodes = require('./nodes').compile;

module.exports = function compile(ast, tolerant = false, suggestions = null) {
    function getNodeSpName(node) {
        let spName;

        if (!nodeSpName.has(node)) {
            spNames.push(spName = 's' + spNames.length);
            nodeSpName.set(node, spName);
        } else {
            spName = nodeSpName.get(node);
        }

        return spName;
    }

    function addSuggestPoint(start, end, type, spName, related) {
        let range = [start, end, JSON.stringify(type)];

        if (type === 'var') {
            if (!ctx.scope.length) {
                return;
            }

            range.push(JSON.stringify(ctx.scope));
        } else {
            if (!spName) {
                spNames.push(spName = 's' + spNames.length);
            }

            range.push(spName);

            if (related) {
                range.push(related);
            }
        }


        normalizedSuggestRanges.push(range);

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
                (spName, range) => addSuggestPoint(...range, spName),
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

    function walk(node, relatedNode) {
        let spName = false;

        if (suggestions !== null) {
            if (suggestions.has(node)) {
                for (const [start, end, type, related] of suggestions.get(node)) {
                    if (type === 'var') {
                        addSuggestPoint(start, end, type);
                    } else if (related === true) {
                        ctx.scope.captureCurrent.push([start, end, type]);
                    } else {
                        if (!spName) {
                            spName = getNodeSpName(node);
                            buffer.push('stat(' + spName + ',');
                        }

                        if (type) {
                            addSuggestPoint(start, end, type, spName, related && getNodeSpName(related));
                        }
                    }
                }
            }

            if (node.type === 'Current' &&
                ctx.scope.firstCurrent === null &&
                ctx.scope.captureCurrent.disabled !== true) {
                ctx.scope.firstCurrent = buffer.length;
            }
        }

        if (nodes.has(node.type)) {
            nodes.get(node.type)(node, ctx, relatedNode);
        } else {
            throw new Error('Unknown node type `' + node.type + '`');
        }

        if (spName) {
            buffer.push(')');
        }
    }

    const spNames = [];
    const nodeSpName = new WeakMap();
    const allocatedVars = [];
    const normalizedSuggestRanges = [];
    const buffer = [
        'const current=data;',
        { toString() {
            return allocatedVars.length > 0 ? 'let ' + allocatedVars + ';\n' : '';
        } },
        { toString() {
            return spNames.length === 0
                ? ''
                : [
                    'const stat=(s,v)=>(s.add(v),v);\n',
                    'const ' + spNames.map(name => name + '=new Set()') + ';\n'
                ].join('');
        } },
        'return '
    ];

    const ctx = {
        tolerant,
        scope: [],
        createScope,
        error: (message, node) => {
            const error = new SyntaxError(message);

            if (node && node.range) {
                error.details = {
                    loc: {
                        range: node.range
                    }
                };
            }

            if (!tolerant) {
                throw error;
            }
        },
        allocateVar() {
            const name = 'tmp' + allocatedVars.length;
            allocatedVars.push(name);
            return name;
        },
        put: chunk => buffer.push(chunk),
        node: walk,
        nodeOrNothing(node, relatedNode) {
            if (node) {
                walk(node, relatedNode);
            }
        },
        nodeOrCurrent(node, relatedNode) {
            walk(node || { type: 'Current' }, relatedNode);
        },
        list(list, sep, relatedNode) {
            list.forEach((node, idx) => {
                if (idx > 0) {
                    buffer.push(sep);
                }
                walk(node, relatedNode);
            });
        }
    };

    createScope(
        () => walk(ast),
        (scopeStart, sp) => {
            buffer.push(')');
            return '(' + sp + ',' + scopeStart;
        }
    );

    if (suggestions !== null) {
        buffer.push('\n,[' + normalizedSuggestRanges.map(s => '[' + s + ']') + ']');
    }

    try {
        return new Function('f', 'm', 'data', 'context', buffer.join(''));
    } catch (e) {
        const error = createError('SyntaxError', 'Jora query compilation error');
        const compiledSource = buffer.join('');

        error.compiledSource = compiledSource;

        throw error;
    }
};
