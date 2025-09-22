// Parity wrapper additions: legacy parser is renamed to legacyParser below and
// a new wrapper export is defined at end to run both legacy and new parsers.
import legacyParser from './parse-old.js';
import newImplementation from './parser/index.js';
// import { tokenNames as __newTokenNames } from '../rework-parser/tokens.js';
// File output for parity diffs
// Guard import for environments without node fs (e.g., browser bundling)
const { parse: newParse, tokenize: newTokenizer } = newImplementation;
let __fs = null;
try { if (typeof process !== 'undefined' && process.versions && process.versions.node) { /* eslint-disable global-require */ __fs = await import('node:fs'); } } catch (_) { /* ignore */ }
const __tokenPunctMap = Object.freeze({
    PLUS: '+', MINUS: '-', STAR: '*', SLASH: '/', PERCENT: '%',
    LPAREN: '(', RPAREN: ')', LBRACK: '[', RBRACK: ']', LBRACE: '{', RBRACE: '}',
    COMMA: ',', SEMICOLON: ';', COLON: ':', DOT: '.', BAR: '|', PIPE: '|',
    EQ: '=', NEQ: '!=', MATCH: '~=', GTE: '>=', LTE: '<=', GT: '>', LT: '<',
    ARROW: '=>', DOT_DOT: '..', DOT_DOT_DOT: '...', MAP_PAREN: '.(', MAP_REC_PAREN: '..(', MAP_BRACK: '.['
});
const __paritySeen = new Set();
let __parityDiffCounter = 0;
const __parityDiffs = [];
let __parityFlushScheduled = false;

function __parityFilePath() {
    if (typeof process === 'undefined' || !process.env) return null;
    return process.env.JORA_PARSER_PARITY_FILE || 'jora-parser-parity-diffs.jsonl';
}

function __scheduleFlush() {
    if (__parityFlushScheduled) return;
    __parityFlushScheduled = true;
    if (typeof process === 'undefined') return;
    let __flushed = false;
    const flush = () => {
        if (__flushed) return;
        __flushed = true;
        const file = __parityFilePath();
        if (!file || !__fs) return;
        try {
            // Build summary
            const counts = {};
            for (const d of __parityDiffs) {
                const record = counts[d.kind] || { count: 0, subcounts: {}, queries: new Set() };
                let subcountsKey = null;
                counts[d.kind] = record;
                record.count++;
                switch (d.kind) {
                    case 'NEW_PARSE_ERROR':
                        subcountsKey = d.newContext.slice(7);
                        break;
                    case 'NEW_NO_PARSE_ERROR':
                        subcountsKey = d.legacyContext.split('\n')[0].slice(7);
                        break;
                }
                if (subcountsKey) {
                    const subrecord = record.subcounts[subcountsKey] || { count: 0, queries: new Set() };
                    record.subcounts[subcountsKey] = subrecord;
                    subrecord.count++;
                    subrecord.queries.add(`${d.tolerant ? '(tolerant mode) ' : ''}${JSON.stringify(d.source)}`);
                } else {
                    record.queries.add(`${d.tolerant ? '(tolerant mode) ' : ''}${JSON.stringify(d.source)}`);
                }
            }
            const summary = {
                type: 'ARY',
                total: __paritySeen.size,
                success: __paritySeen.size - __parityDiffs.length,
                failed: __parityDiffs.length,
                failedCounts: counts,
                generatedAt: new Date().toISOString()
            };
            const lines = __parityDiffs
                .map(d => JSON.stringify(d, (k, v) =>
                    (k === 'legacyAst' || k === 'newAst'
                        ? undefined
                        : v))
                ).concat(JSON.stringify(summary), '');
            __fs.writeFileSync(file, lines.join('\n'));
            __fs.writeFileSync(file.replace(/\.jsonl$/, '.json'), JSON.stringify({ summary, parity: __parityDiffs }));

            console.log(`[jora][parser-parity] Queries: ${__paritySeen.size}, Failed: ${__parityDiffs.length}`);
            if (__parityDiffs.length) {
                console.log(`[jora][parser-parity] Failed by type:`);
                for (const [kind, value] of Object.entries(counts).sort((a, b) => b[0] < a[0] ? 1 : -1)) {
                    console.log(`   ${kind}: ${value.count}`);
                    if (value.subcounts && Object.keys(value.subcounts).length) {
                        for (const [subkind, subrecord] of Object.entries(value.subcounts).sort((a, b) => b[1].count - a[1].count)) {
                            console.log(`    ${subrecord.count.toString().padStart(4)} x "${subkind}"`);
                            // for (const query of subrecord.queries) {
                            //     console.log(`          - ${query}`);
                            // }
                            // console.log();
                        }
                    } else {
                        // for (const query of value.queries) {
                        //     console.log(`      - ${query}`);
                        // }
                    }
                }
            } else {
                console.log('🎉 No differences found!');
            }
        } catch (e) {
            // eslint-disable-next-line no-console
            console.warn('[jora][parser-parity] failed to write parity file:', e && e.message);
        }
    };
    process.on('exit', flush);
    process.on('beforeExit', flush);
    // best effort for abrupt stops
    process.on('SIGINT', () => { flush(); process.exit(130); });
    process.on('SIGTERM', () => { flush(); process.exit(143); });
}

// ------- PARITY WRAPPER START -------
function __parityMode() {
    if (typeof process === 'undefined' || !process.env) return undefined;
    return process.env.JORA_PARSER_PARITY; // legacy | new | off | new-only
}

function __strip(node) {
    if (!node || typeof node !== 'object') return node;
    if (Array.isArray(node)) return node.map(__strip);
    const out = {};
    for (const k of Object.keys(node)) {
        if (k === 'range' || k === 'loc' || k === 'commentRanges' || k === 'errors') continue;
        out[k] = __strip(node[k]);
    }
    return out;
}

function __stable(value) {
    if (value && typeof value === 'object') {
        if (Array.isArray(value)) return '[' + value.map(__stable).join(',') + ']';
        return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + __stable(value[k])).join(',') + '}';
    }
    return JSON.stringify(value);
}

function __sliceWindow(str, i, context = 40) {
    return str.slice(Math.max(0, i - context), i + context);
}

function __firstDiff(a, b) {
    const len = Math.min(a.length, b.length);
    let i = 0; for (; i < len; i++) if (a[i] !== b[i]) break;
    return { index: i, a: __sliceWindow(a, i), b: __sliceWindow(b, i) };
}

function __log(kind, tolerantMode, source, legacyData, newData) {
    const key = kind + ':' + tolerantMode + ':' + source;
    if (__paritySeen.has(key)) return;
    __paritySeen.add(key);
    const id = ++__parityDiffCounter;
    try {
        const A = __stable(__strip(legacyData));
        const B = __stable(__strip(newData));
        if (A !== B) {
            const isLegacyError = typeof legacyData === 'string' && legacyData.startsWith('Error: ');
            const isNewError = typeof newData === 'string' && newData.startsWith('Error: ');
            
            let diff = null;

            if (isLegacyError && isNewError) {
                kind = 'ERROR_MISMATCH';
                diff =__firstDiff(A, B);
            } else if (isLegacyError) {
                kind = 'NEW_NO_PARSE_ERROR';
                diff = { index: -1, a: legacyData, b: __sliceWindow(B, 0, 80) };
            } else if (isNewError) {
                kind = 'NEW_PARSE_ERROR';
                diff = { index: -1, a: __sliceWindow(A, 0, 80), b: newData };
            } else {
                diff =__firstDiff(A, B);
            }

            __parityDiffs.push({
                id,
                kind,
                tolerant: tolerantMode,
                mode: __parityMode() || 'legacy',
                source: source.length > 100 ? source.slice(0, 100) + '…' : source,
                // legacyLength: A.length,
                // newLength: B.length,
                diffIndex: diff.index,
                legacyContext: diff.a,
                legacyAst: isLegacyError ? null : legacyData,
                newContext: diff.b,
                newAst: isNewError ? null : newData
            });
        }
    } catch (e) {
        __parityDiffs.push({ id, kind: 'ERROR', tolerant: tolerantMode, error: e && e.message });
    }
    __scheduleFlush();
}

function __runParsers(source, tolerantMode = false) {
    const m = __parityMode();
    const runLegacy = m !== 'off' && m !== 'new';
    const runNew = m !== 'legacy';
    let legacyRes = null, legacyErr = null;
    let newRes = null, newErr = null;

    if (runLegacy) {
        try {
            legacyRes = legacyParser.parse(source, tolerantMode);
        } catch (e) {
            legacyErr = e;
        }
    }
    if (runNew) {
        try {
            newRes = newParse(source, tolerantMode);
        } catch (e) {
            newErr = e;
        }
    }

    // AST diff only when both succeeded
    if (!legacyErr && !newErr && runLegacy && runNew && legacyRes && newRes) {
        __log('AST_MISMATCH', tolerantMode, source, legacyRes.ast, newRes.ast);
    } else if ((legacyErr && !newErr && newRes) || (newErr && !legacyErr && legacyRes)) {
        // One side errored, the other produced AST – log a lightweight mismatch (error vs ast)
        __log('AST_MISMATCH', tolerantMode, source,
            legacyErr ? `Error: ${legacyErr.message}` : legacyRes.ast,
            newErr ? `Error: ${newErr.message}` : newRes.ast
        );
    }

    // Decide which result to expose
    if (m === 'new' || m === 'off') {
        if (!tolerantMode && newErr) throw newErr;
        return newRes; // may be null if parse failed & tolerantMode true (unlikely)
    }
    // legacy default
    if (!tolerantMode && legacyErr) {
        // If legacy failed but new succeeded and mode is dual (parity), surface legacy error
        throw legacyErr;
    }
    if (legacyRes) return legacyRes;
    // Fallback to new if legacy not run or failed in tolerant mode scenario
    if (!tolerantMode && newErr) throw newErr;
    return newRes;
}

function *__tokenize(source, tolerantMode = false, loc = false) {
    const m = __parityMode();
    const wantLegacy = m !== 'off' && m !== 'new';
    const wantNew = m !== 'legacy';

    // Fast path: only new parser tokens
    if (!wantLegacy && wantNew) {
        for (const t of newTokenizer(source, { tolerant: tolerantMode, commentRanges: [] })) {
            if (loc) {
                // adapt token shape to legacy (offset, type, value) + loc if requested
                yield { type: t.type, value: t.value, offset: t.range[0], loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 0 }, range: t.range } }; // placeholder loc mapping (improve later if needed)
            } else {
                yield { type: t.type, value: t.value, offset: t.range[0] };
            }
        }
        return;
    }

    // Produce legacy tokens for consumer when legacy is active (default behaviour: no loc)
    let legacyOut = [];
    if (legacyParser.tokenize) {
        for (const t of legacyParser.tokenize(source, tolerantMode, loc)) {
            yield t; // stream to caller
            legacyOut.push({ type: t.type, value: String(t.value) });
        }
    }

    if (!wantNew) return; // legacy only mode – no comparison

    // Collect new tokens for comparison only
    try {
        const newSeq = [];
        for (const t of newTokenizer(source, { tolerant: tolerantMode, commentRanges: [] })) {
            let typeName = typeof t.type === 'number' ? (t.name || '?') : t.type;
            if (__tokenPunctMap[typeName]) {
                typeName = __tokenPunctMap[typeName];
            }
            newSeq.push({ type: typeName, value: String(t.value) });
        }
        if (legacyOut.length !== newSeq.length || legacyOut.some((t, i) => t.type !== newSeq[i].type || t.value !== newSeq[i].value)) {
            __log('TOKENS', tolerantMode, source, legacyOut, newSeq);
        }
    } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[jora][parser-parity] tokenizer compare failed', e && e.message);
    }
}

const parser = { parse: __runParsers, tokenize: __tokenize };
export default parser;
// export default legacyParser;
