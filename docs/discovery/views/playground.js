/* eslint-env browser */
/* global discovery */

const jora = require('../jora').default;
const { utils: { base64 } } = require('@discoveryjs/discovery');
const beautify = require('js-beautify/js').js;

function compileQuery(compiledCodeEl, astSectionEl, query, queryOptions, options) {
    try {
        const ast = jora.syntax.parse(query, queryOptions.tolerant);

        astSectionEl.classList.remove('not-available');
        astSectionEl.innerHTML = '';
        discovery.view.render(astSectionEl, {
            view: 'struct',
            expanded: 20
        }, ast);
    } catch (error) {
        astSectionEl.classList.add('not-available');
        astSectionEl.textContent = 'AST is not available due to a parse error';
    }

    if (queryEditorErrorMarker) {
        queryEditorErrorMarker.clear();
        queryEditorErrorMarker = null;
    }

    try {
        const res = jora(query, queryOptions);
        const code = (res.query || res).toString();

        compiledCodeEl.innerHTML = '';
        compiledCodeEl.classList.remove('error');
        discovery.view.render(compiledCodeEl, 'source', {
            syntax: 'javascript',
            content: options.raw ? code : beautify(code)
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
    const queryEditorSectionContentEl = document.createElement('div');
    const compiledCodeSectionEl = document.createElement('div');
    const compiledCodeSectionToolbarEl = document.createElement('div');
    const compiledCodeSectionContentEl = document.createElement('div');
    const astSectionEl = document.createElement('div');
    const astSectionToolbarEl = document.createElement('div');
    const astSectionContentEl = document.createElement('div');
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

        const { tolerant, stat } = newPageParams;
        const { raw } = newPageParams;

        compileQuery(
            compiledCodeSectionContentEl,
            astSectionContentEl,
            query,
            { tolerant, stat },
            { raw }
        );
        discovery.setPageParams(newPageParams, true);
        discovery.cancelScheduledRender();
    };

    // QUERY EDITOR
    queryEditorSectionEl.className = 'query-editor';
    queryEditorSectionToolbarEl.className = 'query-editor__toolbar';
    queryEditor.on('change', changeHandler);
    Promise.resolve().then(() => {
        queryEditorSectionContentEl.append(queryEditor.el);
        if (context.params.query) {
            queryEditor.setValue(base64.decode(context.params.query));
        } else {
            queryEditor.setValue('');
            applySource();
        }
    });
    discovery.view.render(queryEditorSectionToolbarEl, [
        { view: 'block', content: 'text:"Jora query"' },
        { view: 'checkbox', checked: '=#.params.tolerant', content: 'text:"Tolerant parsing"', onChange(tolerant) {
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

    // AST
    astSectionEl.className = 'ast';
    astSectionToolbarEl.className = 'ast__toolbar';
    astSectionToolbarEl.append('AST');
    astSectionContentEl.className = 'ast__content';

    // LAYOUT
    queryEditorSectionEl.append(queryEditorSectionToolbarEl, queryEditorSectionContentEl, destroyEl);
    compiledCodeSectionEl.append(compiledCodeSectionToolbarEl, compiledCodeSectionContentEl);
    astSectionEl.append(astSectionToolbarEl, astSectionContentEl);
    el.append(queryEditorSectionEl, compiledCodeSectionEl, astSectionEl);

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
