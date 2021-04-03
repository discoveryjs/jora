const fs = require('fs');
const path = require('path');

function md(filename) {
    return fs.readFileSync(path.join(__dirname, filename) + '.md', 'utf8');
}

module.exports = function() {
    const articles = [
        { slug: 'intro', title: 'Intro', content: md('text/intro') },
        { slug: 'changelog', title: 'Changelog', content: md('../CHANGELOG') }
    ];

    return {
        version: require('../package.json').version,
        index: md('text/index'),
        articles
    };
};
