import legacyParser from '../src/lang/parse-old.js';
import newParser from '../src/lang/parser/index.js';

// Known environment flags for validation
const KNOWN_ENV_FLAGS = [
    'PARITY_MODE',
    'PARITY_PRINT_QUERIES',
    'PARITY_STRIP_METADATA',
    'PARITY_REPORT_FILE'
];
const MODES = {
    'legacy': 'Legacy parser is primary, new parser runs for comparison',
    'new': 'New parser is primary, legacy parser runs for comparison',
    'new-only': 'New parser only, no comparison',
    'off': 'Legacy parser only, no comparison'
};
const STRIP_METADATA_KEYS = [
    'range',
    'loc',
    'commentRanges',
    'errors'
];

// Default parity mode when not specified by environment variable
const DEFAULT_PARITY_MODE = 'legacy';
const DEFAULT_PRINT_QUERIES = false; // Set to true to print all processed queries (for debugging)
const DEFAULT_STRIP_METADATA = true; // Strip loc/range/commentRanges/errors from ASTs for parity comparison

// Configuration
const MODE = getEnvFlag('PARITY_MODE', DEFAULT_PARITY_MODE, MODES);
const PRINT_QUERIES = getEnvFlag('PARITY_PRINT_QUERIES', DEFAULT_PRINT_QUERIES);
const STRIP_METADATA = getEnvFlag('PARITY_STRIP_METADATA', DEFAULT_STRIP_METADATA);
const REPORT_FILEPATH = getEnvFlag('PARITY_REPORT_FILE', 'tmp/parser-parity-diffs.json');

// Guard against invalid mode values
if (!Object.hasOwn(MODES, MODE)) {
    console.error(`Invalid PARITY_MODE: ${MODE}`);
    process.exit(1);
}

// Guard against unknown PARITY_ environment variables (to catch typos)
if (typeof process !== 'undefined' && process.env) {
    const unknownEnvFlags = [];
    for (const key of Object.keys(process.env)) {
        if (key.startsWith('PARITY_') && !KNOWN_ENV_FLAGS.includes(key)) {
            unknownEnvFlags.push(key);
        }
    }

    if (unknownEnvFlags.length) {
        console.warn('Error! Unknown PARITY_ environment variables detected:');
        console.warn('');

        for (const key of unknownEnvFlags) {
            console.warn(`  ${key}=${process.env[key]}`);
        }

        console.warn('');
        console.warn('Please check for typos or remove them if unnecessary.');
        console.warn('Available variables:');
        console.warn();

        for (const key of KNOWN_ENV_FLAGS) {
            console.warn(`  - ${key}`);
        }

        console.warn();
        process.exit(1);
    }
}

// State management
const parityState = {
    seen: new Set(),
    diffs: []
};

// File system access (only in Node.js environment)
let fs = null;
if (typeof process !== 'undefined' && process.versions?.node) {
    try {
        // Use dynamic import for Node.js file system module
        import('node:fs').then(module => {
            fs = module;
        }).catch(() => {
            // Ignore in environments where fs is not available
        });
    } catch {
        // Ignore in browser environments
    }
}

// Utility functions
function getEnvFlag(name, defaultValue, allowedValues = null) {
    // Guard against typos in environment variable names
    if (!KNOWN_ENV_FLAGS.includes(name)) {
        throw new Error(`Unknown environment flag: ${name}`);
    }

    if (typeof process === 'undefined' || !process.env || !(name in process.env)) {
        return defaultValue;
    }

    const value = process.env[name];

    if (allowedValues) {
        if (Object.hasOwn(allowedValues, value) === false) {
            console.error(`Invalid value for ${name}: ${value}`);
            console.error('Allowed values:');
            for (const [key, desc] of Object.entries(allowedValues)) {
                console.error(`  ${key}${key === defaultValue ? ' (default)' : ''}: ${desc}`);
            }
            process.exit(1);
        }

        return value;
    }

    return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function createSliceWindow(str, index, context = 40) {
    const start = Math.max(0, index - context);
    const end = index + context;
    return (
        (start > 0 ? '…' : '') +
        str.slice(start, end) +
        (end < str.length ? '…' : '')
    );
}

function findFirstDiff(a, b, slice = 40) {
    const len = Math.min(a.length, b.length);
    let i = 0;

    for (; i < len; i++) {
        if (a[i] !== b[i]) {
            break;
        }
    }

    return {
        offset: i,
        a: createSliceWindow(a, i, slice),
        b: createSliceWindow(b, i, slice)
    };
}

function shouldStripKey(key) {
    return STRIP_METADATA && STRIP_METADATA_KEYS.includes(key);
}

function findFirstDiffPath(a, b, path = '') {
    if (Object.is(a, b)) {
        return null;
    }

    if (typeof a !== typeof b) {
        return { path, legacy: a, new: b, reason: 'Type mismatch' };
    }

    if (a && typeof a === 'object' && b && typeof b === 'object') {
        if (Array.isArray(a) !== Array.isArray(b)) {
            return { path, legacy: a, new: b, reason: 'Array type mismatch' };
        }

        if (Array.isArray(a)) {
            if (a.length !== b.length) {
                return { path, legacy: a, new: b, reason: 'Array length mismatch' };
            }

            for (let i = 0; i < a.length; i++) {
                const result = findFirstDiffPath(a[i], b[i], `${path}[${i}]`);

                if (result !== null) {
                    return result;
                }
            }
        } else {
            for (const key of Object.keys(a)) {
                if (!shouldStripKey(key)) {
                    if (!Object.hasOwn(b, key)) {
                        return { path, legacy: a, new: b, reason: `Missing key in 'new': ${key}` };
                    }

                    const result = findFirstDiffPath(a[key], b[key], `${path}.${key}`);

                    if (result !== null) {
                        return result;
                    }
                }
            }

            for (const key of Object.keys(b)) {
                if (!shouldStripKey(key) && !Object.hasOwn(a, key)) {
                    return { path, legacy: a, new: b, reason: `Missing key in 'legacy': ${key}` };
                }
            }
        }

        return null;
    }

    return { path, legacy: a, new: b, reason: 'Value mismatch' };
}

function createStableString(value) {
    if (value && typeof value === 'object') {
        if (Array.isArray(value)) {
            return '[' + value.map(createStableString).join(',') + ']';
        }
        return '{' + Object.keys(value).sort()
            .map(k => !shouldStripKey(k)
                ? JSON.stringify(k) + ':' + createStableString(value[k])
                : null)
            .filter(Boolean)
            .join(',') + '}';
    }

    return JSON.stringify(value);
}

// Parity tracking and reporting
function logParityDifference(kind, source, legacyData, newData, options) {
    const key = `${kind}:${options.tolerant}:${options.loc}:${source}`;

    scheduleParityFlush();

    if (parityState.seen.has(key)) {
        return;
    }

    const id = parityState.seen.add(key).size;

    try {
        const stableA = typeof legacyData !== 'string' ? createStableString(legacyData) : legacyData.split('\n')[0];
        const stableB = typeof newData !== 'string' ? createStableString(newData) : newData.split('\n')[0];
        const isLegacyError = typeof legacyData === 'string' && legacyData.startsWith('Error: ');
        const isNewError = typeof newData === 'string' && newData.startsWith('Error: ');

        if (stableA !== stableB) {
            let diffKind = kind;
            let diff = null;
            let firstDiffPath = null;

            if (isLegacyError && isNewError) {
                diffKind = 'ERROR_MISMATCH';
                diff = findFirstDiff(stableA, stableB, 50);
                return; // Ignore error mismatches for now
            } else if (isLegacyError) {
                diffKind = 'NEW_NO_PARSE_ERROR';
                diff = { offset: -1, a: legacyData, b: createSliceWindow(stableB, 0, 80) };
            } else if (isNewError) {
                diffKind = 'NEW_PARSE_ERROR';
                diff = { offset: -1, a: createSliceWindow(stableA, 0, 80), b: newData };
            } else {
                diff = findFirstDiff(stableA, stableB);
                firstDiffPath = findFirstDiffPath(legacyData, newData);
            }

            parityState.diffs.push({
                id,
                kind: diffKind,
                options,
                mode: MODE,
                source: source.length > 100 ? source.slice(0, 100) + '…' : source,
                contextDiffOffset: diff.offset,
                legacyContext: diff.a,
                newContext: diff.b,
                firstDiffPath,
                legacyAst: isLegacyError ? null : legacyData,
                newAst: isNewError ? null : newData
            });
        }
    } catch (error) {
        parityState.diffs.push({
            id,
            kind: 'DIFF_ERROR',
            options,
            mode: MODE,
            source: source.length > 100 ? source.slice(0, 100) + '…' : source,
            error: error?.message,
            stack: error?.stack?.slice(error?.stack?.indexOf('\n') + 1) || null
        });
    }
}

function buildParitySummary() {
    const counts = Object.defineProperty({}, 'toJSON', {
        value: () => Object.fromEntries(
            Object.entries(counts)
                .map(([kind, record]) => [kind, record.count])
        )
    });

    for (const diff of parityState.diffs) {
        const record = counts[diff.kind] || { count: 0, subcounts: {}, details: new Set() };
        let subcountsKey = null;

        switch (diff.kind) {
            case 'NEW_PARSE_ERROR':
                subcountsKey = diff.newContext.slice(7);
                break;
            case 'NEW_NO_PARSE_ERROR':
                subcountsKey = diff.legacyContext.split('\n')[0].slice(7);
                break;
            case 'DIFF_ERROR':
                subcountsKey = diff.error;
                break;
            case 'ERROR_MISMATCH':
                subcountsKey = `Legacy ${diff.legacyContext}\n   New ${diff.newContext}`;
                break;
            case 'AST_MISMATCH':
            case 'TOKENS_MISMATCH':
                // do nothing
                break;
            default:
                console.error('Unknown diff kind:', diff.kind);
        }

        counts[diff.kind] = record;
        record.count++;

        const details = `${diff.tolerant ? '(tolerant mode) ' : ''}${JSON.stringify(diff.source)}`;

        if (subcountsKey) {
            const subrecord = record.subcounts[subcountsKey] || { count: 0, details: new Set(), stack: null };

            record.subcounts[subcountsKey] = subrecord;
            subrecord.count++;

            if (diff.stack) {
                subrecord.stack = diff.stack;
            } else {
                subrecord.details.add(details);
            }
        } else {
            record.details.add(details);
        }
    }

    return {
        type: 'SUMMARY',
        total: parityState.seen.size,
        success: parityState.seen.size - parityState.diffs.length,
        failed: parityState.diffs.length,
        failedCounts: counts,
        generatedAt: new Date().toISOString()
    };
}

function writeParityReport(summary) {
    if (!REPORT_FILEPATH || !fs) {
        return;
    }

    try {
        // Write JSONL format
        fs.writeFileSync(REPORT_FILEPATH + 'l', [
            ...parityState.diffs.map(diff => JSON.stringify(diff, (key, value) =>
                ['legacyAst', 'newAst'].includes(key) ? undefined : value
            )),
            JSON.stringify(summary),
            ''
        ].join('\n'));

        // Write JSON format
        fs.writeFileSync(REPORT_FILEPATH, JSON.stringify({
            summary,
            parity: parityState.diffs
        }, null, 4));
    } catch (error) {
        console.warn('[jora][parser-parity] Failed to write parity file:', error?.message);
    }
}

function logParityResults(summary) {
    // Don't output anything when parity tracking is disabled
    if (MODE === 'off') {
        return;
    }

    const numPad = summary.total.toString().length;

    console.log('================= Parser Parity Report START =================');
    console.log(`Mode:    ${MODE} - ${MODES[MODE]}`);
    console.log(`Report:  ${REPORT_FILEPATH}`);
    console.log();
    console.log(`Queries: ${summary.total.toString().padStart(numPad)}`);
    console.log(`Success: ${summary.success.toString().padStart(numPad)} (${((summary.success / summary.total) * 100).toFixed(2)}%)`);
    console.log(`Failed:  ${summary.failed.toString().padStart(numPad)} (${((summary.failed / summary.total) * 100).toFixed(2)}%)`);
    console.log();

    if (summary.failed === 0) {
        console.log('🎉 No differences found!');
    } else {
        console.log('Issues by type:');
        const sortedCounts = Object.entries(summary.failedCounts)
            .sort(([a], [b]) => a.localeCompare(b));

        for (const [kind, value] of sortedCounts) {
            console.log(`   ${kind}: ${value.count}`);

            if (value.subcounts && Object.keys(value.subcounts).length) {
                const sortedSubcounts = Object.entries(value.subcounts)
                    .sort(([, a], [, b]) => b.count - a.count);

                for (const [subkind, subrecord] of sortedSubcounts) {
                    console.log(`    ${subrecord.count.toString().padStart(4)} x ${subkind.replace(/\n/g, '\n           ')}`);

                    if (subrecord.stack) {
                        console.log(
                            subrecord.stack
                                .split('\n')
                                .map(line => `     ${line
                                    .replace(process.cwd(), '.')
                                    .replace('file://.', '.')
                                } `)
                                .join('\n') + '\n'
                        );
                    }

                    if (PRINT_QUERIES) {
                        for (const details of subrecord.details) {
                            console.log(`         Query: ${details}`);
                        }
                    }
                }
            } else if (PRINT_QUERIES) {
                for (const details of value.details) {
                    console.log(`         Query: ${details}`);
                }
            }
        }
    }

    console.log();
    console.log('================== Parser Parity Report END ==================');
}

let scheduleParityFlush = () => {
    if (typeof process === 'undefined') {
        return;
    }

    let flushed = false;
    const flush = () => {
        if (flushed) {
            return;
        }
        flushed = true;

        const summary = buildParitySummary();
        writeParityReport(summary);
        logParityResults(summary);
    };

    scheduleParityFlush = () => {}; // no-op after first call
    process.on('exit', flush);
    process.on('beforeExit', flush);
    process.on('SIGINT', flush);
    process.on('SIGTERM', flush);
};

// Parser implementations
function parseWithParity(source, tolerant = false) {
    const shouldRunLegacy = MODE !== 'new-only';
    const shouldRunNew = MODE !== 'off';

    // Fast path: only legacy parser
    if (!shouldRunNew) {
        return legacyParser.parse(source, tolerant);
    }

    // Fast path: only new parser
    if (!shouldRunLegacy) {
        return newParser.parse(source, tolerant);
    }

    // Compare both parsers
    let legacyResult = { value: null, error: null };
    let newResult = { value: null, error: null };
    const [primary, secondary] = MODE === 'new'
        ? [newParser, legacyParser]
        : [legacyParser, newParser];
    const [primaryResult, secondaryResult] = MODE === 'new'
        ? [newResult, legacyResult]
        : [legacyResult, newResult];

    try {
        primaryResult.value = primary.parse(source, tolerant);
    } catch (error) {
        primaryResult.error = error;
    }

    try {
        secondaryResult.value = secondary.parse(source, tolerant);
    } catch (error) {
        secondaryResult.error = error;
    }

    // Compare results for parity tracking
    logParityDifference('AST_MISMATCH', source,
        legacyResult.error ? `Error: ${legacyResult.error.message}` : legacyResult.value,
        newResult.error ? `Error: ${newResult.error.message}` : newResult.value,
        { tolerant }
    );

    if (primaryResult.error) {
        throw primaryResult.error;
    }

    return primaryResult.value;
}

function tokenizeWithParity(source, tolerant = false, loc = false) {
    const shouldRunLegacy = MODE !== 'new-only';
    const shouldRunNew = MODE !== 'off';

    // Fast path: only legacy parser tokens
    if (!shouldRunNew) {
        return legacyParser.tokenize(source, tolerant, loc);
    }

    // Fast path: only new parser tokens
    if (!shouldRunLegacy) {
        return newParser.tokenize(source, tolerant);
    }

    // Compare with new tokenizer
    return (function* () {
        const legacyTokenizer = legacyParser.tokenize(source, tolerant, loc);
        const legacyTokens = [];
        const newTokenizer = newParser.tokenize(source, tolerant);
        const newTokens = [];
        const [primary, secondary] = MODE === 'new'
            ? [newTokenizer, legacyTokenizer]
            : [legacyTokenizer, newTokenizer];
        const [primaryTokens, secondaryTokens] = MODE === 'new'
            ? [newTokens, legacyTokens]
            : [legacyTokens, newTokens];

        for (const primaryToken of primary) {
            primaryTokens.push(primaryToken);
            yield{ ...primaryToken, type: primaryToken.name || primaryToken.type };
        }

        // Drain remaining secondary tokens
        for (const secondaryToken of secondary) {
            secondaryTokens.push(secondaryToken);
        }

        // Normalize token types for comparison
        for (let i = 0; i < newTokens.length; i++) {
            newTokens[i] = {
                offset: newTokens[i].start,
                type: newTokens[i].name,
                value: newTokens[i].value,
                ...(loc ? { loc: newTokens[i].loc } : {})
            };
        }

        // Log parity differences
        logParityDifference('TOKENS_MISMATCH', source, legacyTokens, newTokens, { tolerant, loc });
    }());
}

// Export the parser interface
export default {
    parse: parseWithParity,
    tokenize: tokenizeWithParity
};
