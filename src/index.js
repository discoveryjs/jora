const { version } = require('../package.json');
const parse = require('./lang/parse');
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
        const esc = s => JSON.stringify(s).slice(1, -1);
        debug('AST', parseResult.ast);
        debug('Restored source', stringify(parseResult.ast));
        debug('Suggest ranges', parseResult.suggestRanges.sort((a, b) => a[0] - b[0]).map(r => {
            const pre = esc(source.slice(0, r[0])).length;
            const long = esc(source.substring(r[0], r[1])).length;
            return (
                esc(source) + '\n' +
                (' '.repeat(pre) + (!long ? '\\' : '~'.repeat(long)) + ' ' + r[0] + ':' + r[1] + ' [' + r[2] + '] from ' + r[3])
            );
        }).join('\n'));
    }

    const fn = statMode
        ? compile(parseResult.ast, parseResult.suggestRanges, statMode)
        : compile(parseResult.ast);

    if (debug) {
        debug('Function', fn.toString());
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

    if (cache.has(source)) {
        fn = cache.get(source);
    } else {
        fn = compileFunction(source, statMode, tolerantMode, options.debug);
        cache.set(source, fn);
    }

    return statMode
        ? (data, context) => createStatApi(source, fn(buildin, localMethods, data, context))
        : (data, context) => fn(buildin, localMethods, data, context);
};

module.exports = Object.assign(createQuery, {
    version,
    buildin,
    methods,
    syntax: {
        parse,
        stringify,
        compile
    }
});
