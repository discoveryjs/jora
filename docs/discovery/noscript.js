const { marked } = require('marked');

marked.setOptions({
    mangle: false,
    headerIds: false
});

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function linearArticles(articles, result = []) {
    for (const article of articles) {
        result.push(article);

        if (Array.isArray(article.children)) {
            linearArticles(article.children, result);
        }
    }

    return result;
}

function articlesToToc(articles) {
    return `<ul>${articles.map(article =>
        `<li><a href="#article:${article.slug}">${article.title}</a></li>${
            article.children ? articlesToToc(article.children) : ''
        }`
    ).join('\n')}</ul>`;
}

module.exports = async function(getData, setup) {
    const data = await getData();
    const atricles = linearArticles(data.articles);
    const html = atricles.map(article => {
        return marked(`# ${article.title}\n\n${article.content}`, {
            smartLists: true,
            renderer: new class extends marked.Renderer {
                heading(text, level, raw, slugger) {
                    const slug = slugger.slug(raw);
                    const hash = level === 1
                        ? `article:${escapeHtml(article.slug)}`
                        : `article:${escapeHtml(article.slug)}&!anchor=${escapeHtml(slug)}`;
                    const anchor = `<a id="${hash}" href="#${hash}">#</a>`;
                    const tagLevel = Math.min(level + 1, 6);

                    return `<h${tagLevel}>${text} ${anchor}</h${tagLevel}>\n`;
                }
            }
        }) + '\n<a href="#">To top ↑</a>\n';
    }).join('\n\n');

    return [
        '<style>',
        '  body { margin: 1em 30px }',
        '  pre code[class^=language-] { display: block; padding: 8px; background: #eee; }',
        '  table { border-collapse: collapse; }',
        '  td, th { border: 1px solid #888; padding: 4px 1ex; vertical-align: top; }',
        '  blockquote { border-inline-start: 2px solid #888; margin-inline-start: 0px; padding-inline-start: 10px; }',
        '  h1 a, h2 a, h3 a, h4 a, h5 a, h6 a { color: #aaa; scroll-margin-top: .8em; }',
        '</style>',
        `<h1>${setup.model.name}</h1>`,
        marked(data.intro),
        '<h2>Table of content</h2>',
        articlesToToc(data.articles),
        html
    ].join('\n');
};
