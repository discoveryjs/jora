const fs = require('fs');
const path = require('path');
const marked = require('marked');
const jora = require('jora');

function md(filename) {
    return fs.readFileSync(path.join(__dirname, filename) + '.md', 'utf8');
}

function processMarkdown(article, href, { examples }) {
    let lastHeader = null;

    for (const token of marked.lexer(article.content || '')) {
        switch (token.type) {
            case 'heading': {
                lastHeader = token.text;

                if (Array.isArray(article.headers)) {
                    article.headers.push({ title: token.text, level: token.depth });
                }
                break;
            }

            case 'code': {
                if (token.lang === 'jora') {
                    // console.log(token)
                    try {
                        const methodRefs = [];
                        const ast = jora.syntax.parse(token.text).ast;

                        jora.syntax.walk(ast, function(node) {
                            if (node.type === 'Method' && node.reference.type === 'Identifier') {
                                methodRefs.push({
                                    method: node.reference.name,
                                    range: node.range,
                                    nameRange: node.reference.range
                                });
                            }
                        });

                        examples.push({
                            slug: article.slug,
                            header: lastHeader,
                            methodRefs,
                            source: token.text,
                            ast: ast
                        });
                    } catch (e) {
                        // console.log();
                        // console.log('[ERROR] ========', href);
                        // console.log(e.message);
                        // console.log(token.text);
                    }
                }

                break;
            }
        }
    }
}

module.exports = function() {
    const examples = [];
    const changelog = { slug: 'changelog', title: 'Changelog', headers: true, content: md('../../CHANGELOG') };
    const articles = [
        { slug: 'getting-started', title: 'Getting started', expanded: true, headers: true },
        changelog
    ];
    const docsReadme = md('../README');
    const docsReadmeTOC = docsReadme.match(/- \[.+?\]\(.+?\).*?\n/g)
        .map(point => {
            const [, title, href] = point.match(/\[(.+?)\]\((.+)\.md\)/);
            const slug = href.replace(/\.(\/articles)?\/|\.md$/g, '');
            const content = md(`.${href}`)
                .replace(/^#.+?\n+/, '')
                .replace(/\(#(.+?)\)/g, `(#article:jora-syntax-${slug}&!anchor=$1)`)
                .replace(/\(\.\/syntax-overview\.md\)/g, '(#article:jora-syntax)')
                .replace(/\(\.\/([^\)]+?)\.md#([a-z0-9\-]+)\)/g, '(#article:jora-syntax-$1&!anchor=$2)')
                .replace(/\(\.\/([^\)]+?)\.md\)/g, '(#article:jora-syntax-$1)');
            const article = {
                slug: `jora-syntax-${slug}`,
                title,
                href,
                // headers: [],
                // expanded: true,
                content
            };

            processMarkdown(article, href, { examples });

            return { ...article };
        });

    for (let article of articles) {
        if ('content' in article === false) {
            article.content = md(`text/${article.slug}`);
        }

        if (article.headers) {
            article.headers = [];
        }

        processMarkdown(article, article.href || article.slug, { examples });
    }

    const changelogSections = changelog.content.split(/^#+\s*(.+)$/gm).slice(1);
    const changelogMethodRefs = {};
    for (let i = 0; i < changelogSections.length; i += 2) {
        const [header, content] = changelogSections.slice(i, i + 2);
        const [, version, date] = header.match(/(\S+)\s+\((.+)\)/) || [, header];

        for (const token of marked.lexer(content || '')) {
            if (token.type === 'list') {
                for (let item of token.items) {
                    const [typeOfChange] = item.text.match(/^\S+/);
                    const prelude = item.text.split(/[;]/)[0];
                    const methodRefs =
                        prelude.match(/`[a-z\d]+\([^\)]*?\)`(?=(?:\s*(?:and|,)\s*`[a-z\d]+\([^\)]*?\)`)*\s*method)/ig) ||
                        prelude.match(/(?<=methods?\s*(?::\s*)?(?:`[a-z\d]+\([^\)]*?\)`\s*(?:and|,)\s*)*)`[a-z\d]+\([^\)]*?\)`/ig);
                    if (methodRefs) {
                        for (const methodRef of methodRefs) {
                            const method = methodRef.slice(1).match(/^[^\(]+/);

                            if (!Array.isArray(changelogMethodRefs[method])) {
                                changelogMethodRefs[method] = [];
                            }

                            changelogMethodRefs[method].push({
                                type: typeOfChange,
                                version,
                                date,
                                entry: item.text
                            });
                        }
                    }
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
        intro: md('./text/intro'),
        articles,
        examples,
        changelogMethodRefs
    };
};
