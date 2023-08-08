/* eslint-env browser */
/* global discovery */

const jora = require('../jora').default;
const { utils: { base64 } } = require('@discoveryjs/discovery');
const beautify = require('js-beautify/js').js;

const querySuggestionRangeTooltip = [
    { view: 'block', content: 'text:`Range: [${range[0]}, ${range[1]}]`' },
    { view: 'block', content: [
        'text:"Origins:"',
        {
            view: 'ul',
            data: 'defs',
            item: [
                'badge:type',
                'text:" " + origin'
            ]
        }
    ] },
    { view: 'block', content: [
        'text:"Suggestions:"',
        {
            view: 'ul',
            emptyText: 'No suggestions',
            data: 'suggestions', item: [
                'badge:type',
                'text:` ${suggestions[0:3].join(", ")}${suggestions.size() | $ > 3 ? `, +${$ - 3} more…` : ""}`'
            ]
        }
    ] }

    // 'struct{ expanded: 2, data: suggestions }',
    // 'struct{ expanded: 2 }'
];

function compileQuery(
    compiledCodeEl,
    statSectionEl,
    parseResultSectionEl,
    query,
    { stat, tolerant, raw, tokens }
) {
    const data = {};
    const context = {};
    let parseResult = null;
    let parseTokens = null;
    let queryFn = null;

    try {
        parseResult = jora.syntax.parse(query, tolerant);
    } catch (_) {}

    try {
        if (tokens) {
            parseTokens = [...jora.syntax.tokenize(query, tolerant, true)];
        }
    } catch (_) {}

    if (parseResult || parseTokens) {
        parseResultSectionEl.classList.remove('not-available');
        parseResultSectionEl.innerHTML = '';

        if (parseTokens) {
            discovery.view.render(parseResultSectionEl, {
                view: 'table',
                limit: false,
                cols: [
                    'offset',
                    'loc',
                    { header: 'type', content: 'badge:type' },
                    { header: 'value', content: 'struct:value' }
                ]
            }, parseTokens);
        } else {
            discovery.view.render(parseResultSectionEl, {
                view: 'struct',
                expanded: 20
            }, parseResult.ast);
        }
    } else {
        parseResultSectionEl.classList.add('not-available');
        parseResultSectionEl.textContent = `Not available due to a ${tokens ? 'tokenization' : 'parse'} error`;
    }

    if (queryEditorErrorMarker) {
        queryEditorErrorMarker.clear();
        queryEditorErrorMarker = null;
    }

    try {
        queryFn = jora(query, { stat, tolerant });

        const code = (queryFn.query || queryFn).toString();

        compiledCodeEl.innerHTML = '';
        compiledCodeEl.classList.remove('error');
        discovery.view.render(compiledCodeEl, 'source', {
            syntax: 'javascript',
            content: raw ? code : beautify(code)
        });
    } catch (error) {
        compiledCodeEl.classList.add('error');
        compiledCodeEl.textContent = String(error) +
            (error.compiledSource ? '\n\n' + error.compiledSource : '');

        const loc = error.details && error.details.loc;
        const doc = queryEditor.cm.doc;

        if (loc) {
            const [start, end] = error.details.loc.range;

            queryEditorErrorMarker = error.details.token === 'EOF' || start === end || query[start] === '\n'
                ? doc.setBookmark(
                    doc.posFromIndex(start),
                    { widget: errorMarkerWidgetProto.cloneNode(true) }
                )
                : doc.markText(
                    doc.posFromIndex(start),
                    doc.posFromIndex(end),
                    { className: 'discovery-editor-error' }
                );
        }
    }

    if (stat) {
        if (parseResult) {
            statSectionEl.classList.remove('not-available');

            try {
                const suggestions = jora.syntax.suggest(query, parseResult);
                const ranges = [].concat(...[...suggestions.entries()]
                    .map(([node, ranges]) => ranges.map(range => [node, ...range]))
                    .sort((a, b) => a[1] - b[1]));
                const groupedRanges = [];
                let prevGroupedRange = null;

                for (let i = 0; i < ranges.length; i++) {
                    const [node, start, end, type, related] = ranges[i];
                    const def = {
                        type,
                        origin: node.type +
                            (related === true
                                ? ' (current)'
                                : related && related.type
                                    ? ' & ' + related.type
                                    : '')
                    };

                    if (prevGroupedRange !== null &&
                        prevGroupedRange.start === start &&
                        prevGroupedRange.end === end) {
                        prevGroupedRange.defs.push(def);
                    } else {
                        prevGroupedRange = { start, end, defs: [def] };
                        groupedRanges.push(prevGroupedRange);
                    }
                }

                statSectionEl.innerHTML = '';
                discovery.view.render(statSectionEl, 'source', {
                    syntax: 'jora',
                    content: query,
                    refs: groupedRanges.map(({ start, end, defs }) => {
                        return {
                            range: [start, end],
                            get suggestions() {
                                if (!queryFn) {
                                    return null;
                                }

                                const res = queryFn(data, context);
                                return res.suggestion(start);
                            },
                            defs,
                            tooltip: querySuggestionRangeTooltip
                        };
                    })
                });
            } catch (error) {
                statSectionEl.textContent = String(error);
            }
        } else {
            statSectionEl.classList.add('not-available');
            statSectionEl.textContent = 'Not available due to a parse error';
        }
    } else {
        statSectionEl.classList.add('not-available');
        statSectionEl.textContent = 'Enable stat mode to see suggestions and statistics';
    }
}

const getQuerySuggestions = () => null; // (query, offset, data, context) => jora(query, offset, data, context);
const queryEditor = new discovery.view.QueryEditor(getQuerySuggestions);
let queryEditorErrorMarker;
const errorMarkerWidgetProto = (() => {
    const el = document.createElement('span');

    el.className = 'discovery-editor-error';
    el.textContent = ' ';

    return el;
})();

discovery.view.define('playground', function(el, config, data, context) {
    const destroyEl = document.createElement('destroy-handler');
    const queryEditorSectionEl = document.createElement('div');
    const queryEditorSectionToolbarEl = document.createElement('div');
    const compiledCodeSectionEl = document.createElement('div');
    const compiledCodeSectionToolbarEl = document.createElement('div');
    const compiledCodeSectionContentEl = document.createElement('div');
    const statSectionEl = document.createElement('div');
    const statSectionToolbarEl = document.createElement('div');
    const statSectionContentEl = document.createElement('div');
    const parseResultSectionEl = document.createElement('div');
    const parseResultSectionToolbarEl = document.createElement('div');
    const parseResultSectionContentEl = document.createElement('div');
    const changeHandler = () => applySource();

    function applySource(newOptions) {
        const query = queryEditor.getValue();
        const newPageParams = {
            ...discovery.pageParams
        };

        for (let [key, value] of Object.entries({ ...newOptions, query: base64.encode(query) })) {
            if (value !== null && value !== undefined && value !== false && value !== '') {
                newPageParams[key] = value;
            } else {
                delete newPageParams[key];
            }
        }

        compileQuery(
            compiledCodeSectionContentEl,
            statSectionContentEl,
            parseResultSectionContentEl,
            query,
            newPageParams
        );
        discovery.setPageParams(newPageParams, true);
        discovery.cancelScheduledRender();
    };

    // QUERY EDITOR
    queryEditorSectionEl.className = 'query-editor';
    queryEditorSectionToolbarEl.className = 'query-editor__toolbar';
    queryEditor.on('change', changeHandler);
    Promise.resolve().then(() => {
        queryEditorSectionEl.append(queryEditor.el);
        if (context.params.query) {
            queryEditor.setValue(base64.decode(context.params.query));
        } else {
            queryEditor.setValue('');
            applySource();
        }
    });
    discovery.view.render(queryEditorSectionToolbarEl, [
        { view: 'block', content: 'text:"Jora query"' },
        { view: 'checkbox', checked: '=#.params.tolerant', content: 'text:"Tolerant mode"', onChange(tolerant) {
            applySource({ tolerant });
        } }
    ], {}, context);

    // COMPILED CODE
    compiledCodeSectionEl.className = 'compiled-code';
    compiledCodeSectionToolbarEl.className = 'compiled-code__toolbar';
    compiledCodeSectionContentEl.className = 'compiled-code__content';
    discovery.view.render(compiledCodeSectionToolbarEl, [
        { view: 'block', content: 'text:"Compiled code (JavaScript)"' },
        { view: 'checkbox', checked: '=#.params.stat', content: 'text:"Stat mode"', onChange(stat) {
            applySource({ stat });
        } },
        { view: 'checkbox', checked: '=not #.params.raw', content: 'text:"Beautify"', onChange(beautify) {
            applySource({ raw: !beautify });
        } }
    ], {}, context);

    // STAT
    statSectionEl.className = 'stat';
    statSectionToolbarEl.className = 'stat__toolbar';
    statSectionToolbarEl.append('Suggestion ranges');
    statSectionContentEl.className = 'stat__content';

    // AST
    parseResultSectionEl.className = 'parse-result';
    parseResultSectionToolbarEl.className = 'parse-result__toolbar';
    discovery.view.render(parseResultSectionToolbarEl, {
        view: 'toggle-group',
        value: '=#.params.tokens ? "tokens" : "ast"',
        onChange(value) {
            applySource({ tokens: value === 'tokens' });
        }
    }, [
        { text: 'AST', value: 'ast' },
        { text: 'Tokens', value: 'tokens' }
    ], context);
    parseResultSectionContentEl.className = 'parse-result__content';

    // LAYOUT
    queryEditorSectionEl.append(queryEditorSectionToolbarEl, destroyEl);
    compiledCodeSectionEl.append(compiledCodeSectionToolbarEl, compiledCodeSectionContentEl);
    statSectionEl.append(statSectionToolbarEl, statSectionContentEl);
    parseResultSectionEl.append(parseResultSectionToolbarEl, parseResultSectionContentEl);
    el.append(queryEditorSectionEl, compiledCodeSectionEl, statSectionEl, parseResultSectionEl);

    // TEARDOWN
    destroyEl.onDestroy = () => {
        queryEditor.off('change', changeHandler);
        queryEditor.setValue('');
    };
});

class DestroyHandlerElement extends HTMLElement {
    disconnectedCallback() {
        this.onDestroy();
        this.onDestroy = null;
    }
}

customElements.define('destroy-handler', DestroyHandlerElement);
