import legacyParser from './parse-old.js';
import newImplementation from './parser/index.js';

const { parse: newParse, tokenize: newTokenizer } = newImplementation;

// Default parity mode when not specified by environment variable
const DEFAULT_PARITY_MODE = 'legacy';

// Configuration
const PARITY_MODE = getParityMode();
const PARITY_FILE_PATH = getParityFilePath();

// State management
const parityState = {
    seen: new Set(),
    diffs: [],
    diffCounter: 0,
    flushScheduled: false
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

// Token type mapping for legacy compatibility
const TOKEN_PUNCT_MAP = Object.freeze({
    PLUS: '+', MINUS: '-', STAR: '*', SLASH: '/', PERCENT: '%',
    LPAREN: '(', RPAREN: ')', LBRACK: '[', RBRACK: ']', LBRACE: '{', RBRACE: '}',
    COMMA: ',', SEMICOLON: ';', COLON: ':', DOT: '.', BAR: '|', PIPE: '|',
    EQ: '=', NEQ: '!=', MATCH: '~=', GTE: '>=', LTE: '<=', GT: '>', LT: '<',
    ARROW: '=>', DOT_DOT: '..', DOT_DOT_DOT: '...', MAP_PAREN: '.(', MAP_REC_PAREN: '..(', MAP_BRACK: '.['
});

// Utility functions
function getParityMode() {
    if (typeof process === 'undefined' || !process.env) {
        return DEFAULT_PARITY_MODE;
    }
    return process.env.JORA_PARSER_PARITY || DEFAULT_PARITY_MODE; // legacy | new | off | new-only
}

function getParityFilePath() {
    if (typeof process === 'undefined' || !process.env) {
        return null;
    }
    return process.env.JORA_PARSER_PARITY_FILE || 'jora-parser-parity-diffs.jsonl';
}

function getModeDescription(mode) {
    switch (mode) {
        case 'legacy':
            return 'Legacy parser is primary, new parser runs for comparison';
        case 'new':
            return 'New parser is primary, legacy parser runs for comparison';
        case 'new-only':
            return 'New parser only, no comparison';
        case 'off':
            return 'Legacy parser only, no comparison';
        default:
            return `Unknown mode: ${mode}`;
    }
}

function createSliceWindow(str, index, context = 40) {
    return str.slice(Math.max(0, index - context), index + context);
}

function findFirstDiff(a, b) {
    const len = Math.min(a.length, b.length);
    let i = 0;
    for (; i < len; i++) {
        if (a[i] !== b[i]) {
            break;
        }
    }
    return {
        index: i,
        a: createSliceWindow(a, i),
        b: createSliceWindow(b, i)
    };
}

function stripAstMetadata(node) {
    if (!node || typeof node !== 'object') {
        return node;
    }
    if (Array.isArray(node)) {
        return node.map(stripAstMetadata);
    }

    const result = {};
    for (const key of Object.keys(node)) {
        if (!['range', 'loc', 'commentRanges', 'errors'].includes(key)) {
            result[key] = stripAstMetadata(node[key]);
        }
    }
    return result;
}

function createStableString(value) {
    if (value && typeof value === 'object') {
        if (Array.isArray(value)) {
            return '[' + value.map(createStableString).join(',') + ']';
        }
        return '{' + Object.keys(value).sort()
            .map(k => JSON.stringify(k) + ':' + createStableString(value[k]))
            .join(',') + '}';
    }
    return JSON.stringify(value);
}

// Parity tracking and reporting
function logParityDifference(kind, tolerantMode, source, legacyData, newData) {
    const key = `${kind}:${tolerantMode}:${source}`;
    if (parityState.seen.has(key)) {
        return;
    }

    parityState.seen.add(key);
    const id = ++parityState.diffCounter;

    try {
        const stableA = createStableString(stripAstMetadata(legacyData));
        const stableB = createStableString(stripAstMetadata(newData));

        if (stableA !== stableB) {
            const isLegacyError = typeof legacyData === 'string' && legacyData.startsWith('Error: ');
            const isNewError = typeof newData === 'string' && newData.startsWith('Error: ');

            let diffKind = kind;
            let diff = null;

            if (isLegacyError && isNewError) {
                diffKind = 'ERROR_MISMATCH';
                diff = findFirstDiff(stableA, stableB);
            } else if (isLegacyError) {
                diffKind = 'NEW_NO_PARSE_ERROR';
                diff = { index: -1, a: legacyData, b: createSliceWindow(stableB, 0, 80) };
            } else if (isNewError) {
                diffKind = 'NEW_PARSE_ERROR';
                diff = { index: -1, a: createSliceWindow(stableA, 0, 80), b: newData };
            } else {
                diff = findFirstDiff(stableA, stableB);
            }

            parityState.diffs.push({
                id,
                kind: diffKind,
                tolerant: tolerantMode,
                mode: PARITY_MODE,
                source: source.length > 100 ? source.slice(0, 100) + '…' : source,
                diffIndex: diff.index,
                legacyContext: diff.a,
                legacyAst: isLegacyError ? null : legacyData,
                newContext: diff.b,
                newAst: isNewError ? null : newData
            });
        }
    } catch (error) {
        parityState.diffs.push({
            id,
            kind: 'ERROR',
            tolerant: tolerantMode,
            error: error?.message
        });
    }

    scheduleParityFlush();
}

function buildParitySummary() {
    const counts = {};

    for (const diff of parityState.diffs) {
        const record = counts[diff.kind] || { count: 0, subcounts: {}, queries: new Set() };
        counts[diff.kind] = record;
        record.count++;

        let subcountsKey = null;
        switch (diff.kind) {
            case 'NEW_PARSE_ERROR':
                subcountsKey = diff.newContext.slice(7);
                break;
            case 'NEW_NO_PARSE_ERROR':
                subcountsKey = diff.legacyContext.split('\n')[0].slice(7);
                break;
        }

        if (subcountsKey) {
            const subrecord = record.subcounts[subcountsKey] || { count: 0, queries: new Set() };
            record.subcounts[subcountsKey] = subrecord;
            subrecord.count++;
            subrecord.queries.add(`${diff.tolerant ? '(tolerant mode) ' : ''}${JSON.stringify(diff.source)}`);
        } else {
            record.queries.add(`${diff.tolerant ? '(tolerant mode) ' : ''}${JSON.stringify(diff.source)}`);
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

function writeParityReport() {
    if (!PARITY_FILE_PATH || !fs) {
        return;
    }

    try {
        const summary = buildParitySummary();

        // Write JSONL format
        const lines = [
            ...parityState.diffs.map(diff => JSON.stringify(diff, (key, value) =>
                ['legacyAst', 'newAst'].includes(key) ? undefined : value
            )),
            JSON.stringify(summary),
            ''
        ];
        fs.writeFileSync(PARITY_FILE_PATH, lines.join('\n'));

        // Write JSON format
        const jsonPath = PARITY_FILE_PATH.replace(/\.jsonl$/, '.json');
        fs.writeFileSync(jsonPath, JSON.stringify({
            summary,
            parity: parityState.diffs
        }, null, 2));

        logParityResults(summary);
    } catch (error) {
        console.warn('[jora][parser-parity] Failed to write parity file:', error?.message);
    }
}

function logParityResults(summary) {
    // Don't output anything when parity tracking is disabled
    if (PARITY_MODE === 'off') {
        return;
    }

    console.log(`[jora][parser-parity] Mode: ${PARITY_MODE} - ${getModeDescription(PARITY_MODE)}`);
    console.log(`[jora][parser-parity] Queries: ${summary.total}, Failed: ${summary.failed}`);

    if (summary.failed === 0) {
        console.log('🎉 No differences found!');
        return;
    }

    console.log('[jora][parser-parity] Failed by type:');
    const sortedCounts = Object.entries(summary.failedCounts)
        .sort(([a], [b]) => a.localeCompare(b));

    for (const [kind, value] of sortedCounts) {
        console.log(`   ${kind}: ${value.count}`);

        if (value.subcounts && Object.keys(value.subcounts).length) {
            const sortedSubcounts = Object.entries(value.subcounts)
                .sort(([, a], [, b]) => b.count - a.count);

            for (const [subkind, subrecord] of sortedSubcounts) {
                console.log(`    ${subrecord.count.toString().padStart(4)} x "${subkind}"`);
            }
        }
    }
}

function scheduleParityFlush() {
    if (parityState.flushScheduled || typeof process === 'undefined') {
        return;
    }

    parityState.flushScheduled = true;
    let flushed = false;

    const flush = () => {
        if (flushed) {
            return;
        }
        flushed = true;
        writeParityReport();
    };

    process.on('exit', flush);
    process.on('beforeExit', flush);
    process.on('SIGINT', () => {
        flush(); process.exit(130);
    });
    process.on('SIGTERM', () => {
        flush(); process.exit(143);
    });
}

// Parser implementations
function runBothParsers(source, tolerantMode = false) {
    const shouldRunLegacy = !['new-only'].includes(PARITY_MODE);
    const shouldRunNew = !['off'].includes(PARITY_MODE); // Run new parser unless explicitly off

    let legacyResult = null;
    let legacyError = null;
    let newResult = null;
    let newError = null;

    // Run legacy parser if needed
    if (shouldRunLegacy) {
        try {
            legacyResult = legacyParser.parse(source, tolerantMode);
        } catch (error) {
            legacyError = error;
        }
    }

    // Run new parser if needed
    if (shouldRunNew) {
        try {
            newResult = newParse(source, tolerantMode);
        } catch (error) {
            newError = error;
        }
    }

    // Compare results for parity tracking
    if (shouldRunLegacy && shouldRunNew) {
        if (!legacyError && !newError && legacyResult && newResult) {
            logParityDifference('AST_MISMATCH', tolerantMode, source, legacyResult.ast, newResult.ast);
        } else if ((legacyError && !newError && newResult) || (newError && !legacyError && legacyResult)) {
            logParityDifference('AST_MISMATCH', tolerantMode, source,
                legacyError ? `Error: ${legacyError.message}` : legacyResult.ast,
                newError ? `Error: ${newError.message}` : newResult.ast
            );
        }
    }

    // Return appropriate result based on mode
    if (['new', 'new-only'].includes(PARITY_MODE)) {
        if (!tolerantMode && newError) {
            throw newError;
        }
        return newResult;
    }

    // Default to legacy behavior (legacy, off modes)
    if (!tolerantMode && legacyError) {
        throw legacyError;
    }
    if (legacyResult) {
        return legacyResult;
    }

    // Fallback to new parser if legacy failed (shouldn't happen in normal cases)
    if (!tolerantMode && newError) {
        throw newError;
    }
    return newResult;
}

function* tokenizeWithParity(source, tolerantMode = false, loc = false) {
    const shouldRunLegacy = !['new-only'].includes(PARITY_MODE);
    const shouldRunNew = !['off'].includes(PARITY_MODE); // Run new parser unless explicitly off

    // Fast path: only new parser tokens
    if (!shouldRunLegacy && shouldRunNew) {
        for (const token of newTokenizer(source, { tolerant: tolerantMode, commentRanges: [] })) {
            if (loc) {
                yield{
                    type: token.type,
                    value: token.value,
                    offset: token.range[0],
                    loc: {
                        start: { line: 1, column: 0 },
                        end: { line: 1, column: 0 },
                        range: token.range
                    }
                };
            } else {
                yield{ type: token.type, value: token.value, offset: token.range[0] };
            }
        }
        return;
    }

    // Primary path: run legacy tokenizer and yield its tokens (unless new mode)
    const legacyTokens = [];
    if (shouldRunLegacy && legacyParser.tokenize) {
        for (const token of legacyParser.tokenize(source, tolerantMode, loc)) {
            // For 'new' mode, don't yield legacy tokens, just collect for comparison
            if (PARITY_MODE !== 'new') {
                yield token;
            }
            legacyTokens.push({ type: token.type, value: String(token.value) });
        }
    }

    // For 'new' mode, yield new tokens as primary
    if (PARITY_MODE === 'new' && shouldRunNew) {
        for (const token of newTokenizer(source, { tolerant: tolerantMode, commentRanges: [] })) {
            if (loc) {
                yield{
                    type: token.type,
                    value: token.value,
                    offset: token.range[0],
                    loc: {
                        start: { line: 1, column: 0 },
                        end: { line: 1, column: 0 },
                        range: token.range
                    }
                };
            } else {
                yield{ type: token.type, value: token.value, offset: token.range[0] };
            }
        }
    }

    // Compare with new tokenizer if needed
    if (shouldRunNew) {
        try {
            const newTokens = [];
            for (const token of newTokenizer(source, { tolerant: tolerantMode, commentRanges: [] })) {
                let typeName = typeof token.type === 'number' ? (token.name || '?') : token.type;
                if (TOKEN_PUNCT_MAP[typeName]) {
                    typeName = TOKEN_PUNCT_MAP[typeName];
                }
                newTokens.push({ type: typeName, value: String(token.value) });
            }

            const tokensMatch = legacyTokens.length === newTokens.length &&
                legacyTokens.every((token, i) =>
                    token.type === newTokens[i].type && token.value === newTokens[i].value
                );

            if (!tokensMatch) {
                logParityDifference('TOKENS', tolerantMode, source, legacyTokens, newTokens);
            }
        } catch (error) {
            console.warn('[jora][parser-parity] Tokenizer comparison failed:', error?.message);
        }
    }
}

// Export the parser interface
export default {
    parse: runBothParsers,
    tokenize: tokenizeWithParity
};
