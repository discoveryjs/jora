import { version } from './version.js';
import { hasOwn } from './utils/misc.js';
import parser from './lang/parse.js';
import suggest from './lang/suggest.js';
import walk from './lang/walk.js';
import stringify from './lang/stringify.js';
import { compile, compileMethod } from './lang/compile.js';
import buildin from './lang/compile-buildin.js';
import methods from './methods.js';
import assertions from './assertions.js';
import createStatApi from './stat.js';

const cacheStrict = new Map();
const cacheStrictStat = new Map();
const cacheTollerant = new Map();
const cacheTollerantStat = new Map();

function defineDictFunction(dict, name, value, queryMethods, queryAssertions) {
    if (typeof value === 'string') {
        Object.defineProperty(dict, name, {
            configurable: true,
            get() {
                const compiledFn = compileFunction(value, 'method')(buildin, queryMethods, queryAssertions);
                const fn = compiledFn;

                Object.defineProperty(dict, name, { enumerable: true, value: fn });

                return fn;
            }
        });
    } else if (typeof value === 'function') {
        Object.defineProperty(dict, name, { enumerable: true, value });
    }
}

function buildQueryMethodsAndAssertions(customMethods, customAssertions) {
    if (!customMethods && !customAssertions) {
        return {
            queryMethods: methods,
            queryAssertions: assertions
        };
    }

    const queryMethods = { ...methods };
    const queryAssertions = { ...assertions };

    for (const [name, value] of Object.entries(customMethods || {})) {
        if (hasOwn(methods, name)) {
            throw new Error(`Builtin method "${name}" can\'t be overridden`);
        }

        defineDictFunction(queryMethods, name, value, queryMethods, queryAssertions);
    }

    for (const [name, value] of Object.entries(customAssertions || {})) {
        if (hasOwn(assertions, name)) {
            throw new Error(`Builtin assertion "${name}" can\'t be overridden`);
        }

        defineDictFunction(queryAssertions, name, value, queryMethods, queryAssertions);
    }

    return { queryMethods, queryAssertions };
}

function defaultDebugHandler(sectionName, value) {
    console.log(`[${sectionName}]`);
    if (typeof value === 'string') {
        console.log(value);
    } else if (value !== undefined) {
        console.dir(value, { depth: null });
    }
    console.log();
}

function compileFunction(source, kind, statMode, tolerantMode, debug) {
    debug = typeof debug === 'function' ? debug : Boolean(debug) ? defaultDebugHandler : false;

    if (debug) {
        debug('=========================');
        debug('Compile query from source', source);
    }

    const parseResult = parser.parse(source, tolerantMode);

    if (debug) {
        debug('AST', parseResult.ast);
        debug('Restored source', stringify(parseResult.ast));
    }

    const suggestions = statMode
        ? suggest(source, parseResult)
        : null;

    if (debug && suggestions) {
        const esc = s => JSON.stringify(s).slice(1, -1);
        const ranges = [].concat(...[...suggestions.entries()]
            .map(([node, ranges]) => ranges.map(range => [node, ...range]))
        );
        let prevRange = [];
        let prevPrefix = null;

        debug('Stat/suggestion ranges', ranges.sort((a, b) => a[1] - b[1]).map(([node, ...range]) => {
            const [start, end, type, related] = range;
            let prelude;

            if (start === prevRange[0] && end === prevRange[1]) {
                prelude = ' '.repeat(prevPrefix.length);
            } else {
                const pre = esc(source.slice(0, start)).length;
                const long = esc(source.substring(start, end)).length;

                prevRange = range;
                prevPrefix =
                    ' '.repeat(pre) + (!long ? '\\' : '~'.repeat(long)) +
                    ' ' + start + ':' + end;
                prelude = esc(source) + '\n' + prevPrefix;
            }

            return (
                prelude + ' [' + type + '] on ' + node.type +
                (related === true ? ' (current)' : related && related.type ? ' & ' + related.type : '')
            );
        }).join('\n'));
    }

    const fn = kind === 'method'
        ? compileMethod(parseResult.ast, tolerantMode, suggestions)
        : compile(parseResult.ast, tolerantMode, suggestions);

    if (debug) {
        debug('Compiled code', fn.toString());
    }

    return fn;
}

function createQuery(source, options) {
    options = options || {};

    const statMode = Boolean(options.stat);
    const tolerantMode = Boolean(options.tolerant);
    const cache = statMode
        ? (tolerantMode ? cacheTollerantStat : cacheStrictStat)
        : (tolerantMode ? cacheTollerant : cacheStrict);
    const { methods: customMethods, assertions: customAssertions } = options || {};
    const { queryMethods, queryAssertions } =
        buildQueryMethodsAndAssertions(customMethods, customAssertions);
    let fn;

    source = String(source);

    if (cache.has(source) && !options.debug) {
        fn = cache.get(source);
    } else {
        fn = compileFunction(source, 'query', statMode, tolerantMode, options.debug);
        cache.set(source, fn);
    }

    fn = fn(buildin, queryMethods, queryAssertions);

    return statMode
        ? Object.assign((data, context) => createStatApi(source, fn(data, context)), { query: fn })
        : fn;
}

function setup(options) {
    const cacheStrict = new Map();
    const cacheStrictStat = new Map();
    const cacheTollerant = new Map();
    const cacheTollerantStat = new Map();
    const { methods: customMethods, assertions: customAssertions } = options || {};
    const { queryMethods, queryAssertions } =
        buildQueryMethodsAndAssertions(customMethods, customAssertions);

    return function query(source, queryOptions) {
        queryOptions = queryOptions || {};

        const statMode = Boolean(queryOptions.stat);
        const tolerantMode = Boolean(queryOptions.tolerant);
        const cache = statMode
            ? (tolerantMode ? cacheTollerantStat : cacheStrictStat)
            : (tolerantMode ? cacheTollerant : cacheStrict);
        let fn;

        source = String(source);

        if (cache.has(source) && !queryOptions.debug) {
            fn = cache.get(source);
        } else {
            const perform = compileFunction(
                source,
                'query',
                statMode,
                tolerantMode,
                queryOptions.debug
            )(
                buildin,
                queryMethods,
                queryAssertions
            );
            fn = statMode
                ? Object.assign((data, context) => createStatApi(source, perform(data, context)), { query: perform })
                : perform;
            cache.set(source, fn);
        }

        return fn;
    };
}

export default Object.assign(createQuery, {
    version,
    buildin,
    methods,
    assertions,
    setup,
    syntax: {
        tokenize: parser.tokenize,
        parse: parser.parse,
        suggest,
        walk,
        stringify,
        compile,
        compileMethod
    }
});
