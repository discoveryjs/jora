const fs = require('fs');
const path = require('path');
const marked = require('marked');

function md(filename) {
    return fs.readFileSync(path.join(__dirname, filename) + '.md', 'utf8');
}

module.exports = function() {
    const articles = [
        { slug: 'intro', title: 'Intro' },
        { slug: 'getting-started', title: 'Getting started' },
        { slug: 'syntax', title: 'Query syntax' },
        { slug: 'methods', title: 'Build-in methods' },
        { slug: 'changelog', title: 'Changelog', content: md('../CHANGELOG') }
    ];

    for (let article of articles) {
        if ('content' in article === false) {
            article.content = md(`text/${article.slug}`);
        }

        article.headers = [];
        for (const { type, text, depth } of marked.lexer(article.content || '')) {
            if (type === 'heading') {
                article.headers.push({ text, level: depth });
            }
        }
    }

    return {
        version: require('../package.json').version,
        articles
    };
};
