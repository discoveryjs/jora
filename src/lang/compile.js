import { hasOwn } from '../utils/misc.js';
import createError from './error.js';
import { compile as nodes } from './nodes/index.js';

export function compile(ast, tolerant, suggestions) {
    return compileInternal(ast, 'query', tolerant, suggestions);
}
export function compileMethod(ast, tolerant, suggestions) {
    return compileInternal(ast, 'method', tolerant, suggestions);
}

class Scope extends Set {
    constructor(items, awaitInit = [], arg1 = false, $ref = '$') {
        super(items);
        this.own = new Set();
        this.awaitInit = new Set(awaitInit);
        this.firstCurrent = null;
        this.captureCurrent = [];
        this.arg1 = arg1;
        this.$ref = $ref;
    }

    spawn(arg1, $ref) {
        return new Scope(this, this.awaitInit, arg1, $ref);
    }
}

function compileInternal(ast, kind, tolerant = false, suggestions = null) {
    function newStatPoint(values) {
        const spName = 's' + spNames.length;

        spNames.push(values ? [spName, values] : [spName]);

        return spName;
    }

    function getNodeSpName(node) {
        let spName = nodeSpName.get(node);

        if (!spName) {
            nodeSpName.set(node, spName = newStatPoint());
        }

        return spName;
    }

    function addSuggestPoint(start, end, type, spName, related) {
        let range = [start, end, JSON.stringify(type)];

        if (type === 'var') {
            if (!ctx.scope.size) {
                return;
            }

            range.push(JSON.stringify([...ctx.scope]));
        } else {
            if (!spName) {
                spName = newStatPoint();
            }

            range.push(spName);

            if (related) {
                range.push(typeof related === 'string' ? related : getNodeSpName(related));
            }
        }

        normalizedSuggestRanges.push(range);

        return spName;
    }

    function createScope(fn, defCurrent, $ref = '$') {
        const prevScope = ctx.scope;
        const scopeStart = buffer.length;

        ctx.scope = prevScope.spawn(prevScope.arg1 || kind === 'method', $ref);

        fn();

        if (ctx.scope.captureCurrent.length) {
            const spName = ctx.scope.captureCurrent.reduce(
                (spName, range) => addSuggestPoint(...range, spName),
                undefined
            );
            const stat = 'stat(' + spName + ',' + ctx.scope.$ref + ')';

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
                            addSuggestPoint(start, end, type, spName, related);
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
            throw new Error('Unknown node type "' + node.type + '"');
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
        { toString() {
            if (kind === 'query') {
                return [
                    '((data,context)=>{',
                    ...ctx.usedMethods.size || ctx.usedAssertions.size ? [
                        'const method = (name,...args)=>m[name].apply(mctx,args);',
                        'const assertion = (name,...args)=>a[name].apply(mctx,args);',
                        'const mctx = Object.freeze({context,method,assertion});'
                    ] : []
                ].join('\n') + '\n';
            }

            if (kind === 'method') {
                return [
                    '(function(data){',
                    'const mctx = this;',
                    'const context = mctx.context;'
                ].join('\n') + '\n';
            }

            throw new Error('Unknown kind: ' + kind);
        } },
        { toString() {
            return allocatedVars.length > 0 ? 'let ' + allocatedVars + ';\n' : '';
        } },
        { toString() {
            return spNames.length > 0
                ? [
                    'const stat=(s,v)=>(s.add(v),v);\n',
                    'const ' + spNames.map(([name, values]) =>
                        name + '=new Set(' + (values ? JSON.stringify(values) : '') + ')'
                    ) + ';\n'
                ].join('')
                : '';
        } },
        { toString() {
            const lists = suggestions &&
                Array.isArray(suggestions.literalList) &&
                suggestions.literalList
                    .map(([name, values]) => name + '=' + JSON.stringify(values));

            return lists && lists.length ? 'const ' + lists + ';\n' : '';
        } },
        suggestions === null ? 'return ' : 'return{\nvalue: '
    ];

    const initCtx = {};
    const usedBuildinMethods = new Set();
    const ctx = {
        tolerant,
        usedAssertions: new Map(),
        usedMethods: new Map(),
        suggestions: suggestions !== null,
        buildinFn(name) {
            usedBuildinMethods.add(name);
            return 'f.' + name;
        },
        scope: new Scope(),
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
        },
        'data'
    );

    if (!tolerant) {
        const { usedMethods, usedAssertions } = ctx;

        if (usedAssertions.size) {
            buffer.unshift(' this.assertAssertions(a)||');
            initCtx.assertAssertions = function(providedAssertions) {
                for (const [assertion, range] of usedAssertions.entries()) {
                    if (!hasOwn(providedAssertions, assertion)) {
                        return () => {
                            throw Object.assign(
                                new Error(`Assertion "${assertion}" is not defined`),
                                { details: { loc: { range } } }
                            );
                        };
                    }
                }
            };
        }

        if (usedMethods.size) {
            buffer.unshift(' this.assertMethods(m)||');
            initCtx.assertMethods = function(providedMethods) {
                for (const [method, ranges] of usedMethods.entries()) {
                    if (!hasOwn(providedMethods, method)) {
                        return () => {
                            throw Object.assign(
                                new Error(
                                    `Method "${method}" is not defined. If that's a custom method ` +
                                    'make sure you added it with "methods" section in options'
                                ),
                                { details: { loc: { range: ranges[0] } } }
                            );
                        };
                    }
                }
            };
        }
    }

    if (suggestions !== null) {
        buffer.push(
            ',\nstats: [' + normalizedSuggestRanges.map(s => '[' + s + ']') + ']' +
            ',\nmethods: m' +
            ',\nassertions: a' +
        '\n}');
    }

    try {
        const fn = new Function('f,m,a', 'return' + buffer.join('') + '})');

        return Object.assign(fn.bind(initCtx), {
            toString() {
                return fn.toString().replace(/^(\S+\s+)anonymous([^)\s]+)\s*\)/, '$1query$2)');
            }
        });
    } catch (e) {
        throw createError('SyntaxError', 'Jora query compilation error', {
            compiledSource: buffer.join(''),
            details: e
        });
    }
};
