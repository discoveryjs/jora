const { version } = require('../package.json');
const { tokenize, parse } = require('./lang/parse');
const suggest = require('./lang/suggest');
const walk = require('./lang/walk');
const stringify = require('./lang/stringify');
const compile = require('./lang/compile');
const buildin = require('./lang/compile-buildin');
const methods = require('./methods');
const createStatApi = require('./stat');

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

    const parseResult = parse(source, tolerantMode);

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

        debug('Suggest ranges', ranges.sort((a, b) => a[1] - b[1]).map(([node, ...range]) => {
            const [start, end, type, extra] = range;
            let prelude;

            if (!type) {
                return;
            }

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
                (extra === true ? ' (current)' : extra ? ' & ' + extra.type : '')
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

module.exports = Object.assign(createQuery, {
    version,
    buildin,
    methods,
    setup,
    syntax: {
        tokenize,
        parse,
        suggest,
        walk,
        stringify,
        compile
    }
});
