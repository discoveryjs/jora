const CodeMirror = require('codemirror');
require('codemirror/addon/mode/simple');
const { Slugger } = require('marked');
const slugger = new Slugger();

function walkArticles(article, articleList) {
    articleList.push(article);
    if (Array.isArray(article.children)) {
        for (const child of article.children) {
            walkArticles(child, articleList);
        }
    }
}

module.exports = function(data, { addQueryHelpers }) {
    const articleList = [];

    for (const article of data.articles) {
        walkArticles(article, articleList);
    }

    for (let i = 0; i < articleList.length; i++) {
        const article = articleList[i];

        article.prev = i > 0 ? articleList[i - 1] : null;
        article.next = i + 1 < articleList.length ? articleList[i + 1] : null;
    }

    addQueryHelpers({
        slug(current) {
            return current ? slugger.slug(current, { dryrun: true }) : '';
        }
    });
};

CodeMirror.defineSimpleMode('jq', {
    start: [
        {regex: / ?/, next: 'expression'}
    ],
    object: [
        {regex: / ?/, token: 'bracket', push: 'key'},
        {regex: ',', token: 'bracket', push: 'key'},
        {regex: '}', token: 'bracket', pop: true}
    ],
    array: [
        {regex: ',', token: 'bracket'},
        {regex: / ?/, push: 'value'},
        {regex: ']', token: 'bracket', pop: true}
    ],
    key: [
        {regex: /[a-z]\w*/i, token: 'keyword'},
        {regex: '"', token: 'string', push: 'string'},
        {regex: /\(/, token: 'variable-2', push: 'expression'},
        {regex: ':', token: 'bracket', push: 'value'}
    ],
    value: [
        {regex: /null|true|false/, token: 'atom'},
        {regex: /\d+/, token: 'number'},
        {regex: /\.\w+/, token: 'tag'},
        {regex: /\(/, token: 'variable-2', push: 'expression'},
        {regex: '"', token: 'string', push: 'string'},
        {regex: '{', token: 'bracket', push: 'object'},
        {regex: /\[/, token: 'bracket', push: 'array'},
        {regex: /[,}\]]/, token: 'bracket', pop: true}
    ],
    string: [
        {regex: /[^"\\]+/, token: 'string'},
        {regex: /\\\(/, token: 'variable-2', push: 'expression'},
        {regex: '"', token: 'string', pop: true}
    ],
    expression: [
        {regex: /\.\w+/, token: 'tag'},
        {regex: /\w+|==|!=|\|/, token: 'builtin'},
        {regex: /\(/, token: 'variable-2', push: 'expression'},
        {regex: /\)/, token: 'variable-2', pop: true},
        {regex: '{', token: 'bracket', push: 'object'},
        {regex: /\[/, token: 'bracket', push: 'array'}
    ]
});
