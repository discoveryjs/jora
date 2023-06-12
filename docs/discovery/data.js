const fs = require('fs');
const path = require('path');
const marked = require('marked');

function md(filename) {
    return fs.readFileSync(path.join(__dirname, filename) + '.md', 'utf8');
}

module.exports = function() {
    const articles = [
        // { slug: 'intro', title: 'Introduction' },
        { slug: 'getting-started', title: 'Getting started', expanded: true, headers: true },
        { slug: 'changelog', title: 'Changelog', headers: true, content: md('../../CHANGELOG') }
    ];
    const docsReadme = md('../README');
    const docsReadmeTOC = docsReadme.match(/- \[.+?\]\(.+?\).*?\n/g)
        .map(point => {
            const [, title, href] = point.match(/\[(.+?)\]\((.+)\.md\)/);
            const slug = href.replace(/\.\/articles\/|\.md$/g, '');
            const headers = [];
            const content = md(`.${href}`)
                .replace(/^#.+?\n+/, '')
                .replace(/\(#(.+?)\)/g, `(#article:jora-syntax-${slug}&!anchor=$1)`)
                .replace(/\(\.\/syntax-overview\.md\)/g, '(#article:jora-syntax)')
                .replace(/\(\.\/(.+?)\.md\)/g, '(#article:jora-syntax-$1)');

            for (const { type, text, depth } of marked.lexer(content || '')) {
                if (type === 'heading') {
                    headers.push({ title: text, level: depth });
                }
            }

            return {
                slug: `jora-syntax-${slug}`,
                title,
                // href,
                // headers,
                // expanded: true,
                content
            };
        });

    for (let article of articles) {
        if ('content' in article === false) {
            article.content = md(`text/${article.slug}`);
        }

        if (article.headers) {
            article.headers = [];
            for (const { type, text, depth } of marked.lexer(article.content || '')) {
                if (type === 'heading') {
                    article.headers.push({ title: text, level: depth });
                }
            }
        }
    }

    articles.unshift(docsReadmeTOC.shift());
    articles[0].slug = 'intro';
    articles.splice(2, 0, {
        ...docsReadmeTOC.shift(),
        slug: 'jora-syntax',
        title: 'Jora query syntax',
        expanded: true,
        children: docsReadmeTOC
    });

    return {
        version: require('../../package.json').version,
        articles
    };
};
