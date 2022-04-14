import { version } from './version.js';
import parser from './lang/parse.js';
import suggest from './lang/suggest.js';
import walk from './lang/walk.js';
import stringify from './lang/stringify.js';
import compile from './lang/compile.js';
import buildin from './lang/compile-buildin.js';
import methods from './methods.js';
import createStatApi from './stat.js';

const cacheStrict = new Map();
const cacheStrictStat = new Map();
const cacheTollerant = new Map();
const cacheTollerantStat = new Map();

function defaultDebugHandler(sectionName, value) {
    console.log(`[${sectionName}]`);
    if (typeof value === 'string') {
        console.log(value);
    } else if (value !== undefined) {
        console.dir(value, { depth: null });
    }
    console.log();
}

function compileFunction(source, statMode, tolerantMode, debug) {
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

    const fn = compile(parseResult.ast, tolerantMode, suggestions);

    if (debug) {
        debug('Compiled code', fn.toString());
    }

    return fn;
}

function createQuery(source, options) {
    options = options || {};

    const statMode = Boolean(options.stat);
    const tolerantMode = Boolean(options.tolerant);
    const localMethods = options.methods ? { ...methods, ...options.methods } : methods;
    const cache = statMode
        ? (tolerantMode ? cacheTollerantStat : cacheStrictStat)
        : (tolerantMode ? cacheTollerant : cacheStrict);
    let fn;

    source = String(source);

    if (cache.has(source) && !options.debug) {
        fn = cache.get(source);
    } else {
        fn = compileFunction(source, statMode, tolerantMode, options.debug);
        cache.set(source, fn);
    }

    fn = fn(buildin, localMethods);

    return statMode
        ? (data, context) => createStatApi(source, fn(data, context))
        : fn;
}

function setup(customMethods) {
    const cacheStrict = new Map();
    const cacheStrictStat = new Map();
    const cacheTollerant = new Map();
    const cacheTollerantStat = new Map();
    const localMethods = { ...methods };

    for (const [name, fn] of Object.entries(customMethods || {})) {
        if (typeof fn === 'string') {
            Object.defineProperty(localMethods, name, {
                configurable: true,
                get() {
                    const compiledFn = compileFunction(fn)(buildin, localMethods);
                    const value = current => compiledFn(current, null);
                    Object.defineProperty(localMethods, name, { value });
                    return value;
                }
            });
        } else {
            localMethods[name] = fn;
        }
    }

    return function query(source, options) {
        options = options || {};

        const statMode = Boolean(options.stat);
        const tolerantMode = Boolean(options.tolerant);
        const cache = statMode
            ? (tolerantMode ? cacheTollerantStat : cacheStrictStat)
            : (tolerantMode ? cacheTollerant : cacheStrict);
        let fn;

        source = String(source);

        if (cache.has(source) && !options.debug) {
            fn = cache.get(source);
        } else {
            const perform = compileFunction(source, statMode, tolerantMode, options.debug)(buildin, localMethods);
            fn = statMode
                ? (data, context) => createStatApi(source, perform(data, context))
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
    setup,
    syntax: {
        tokenize: parser.tokenize,
        parse: parser.parse,
        suggest,
        walk,
        stringify,
        compile
    }
});
