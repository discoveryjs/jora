const fs = require('fs');
const path = require('path');
const assert = require('assert');
const marked = require('marked');
const jora = require('jora');
const { parseExample } = require('./parse-example.js');
const mathMethods = new Set([
    'abs', 'acos', 'acosh', 'asin', 'asinh', 'atan', 'atan2', 'atanh',
    'cbrt', 'ceil', 'clz32', 'cos', 'cosh', 'exp', 'expm1', 'floor',
    'fround', 'hypot', 'imul', 'ln', 'log10', 'ln1p', 'log2', 'pow',
    'round', 'sign', 'sin', 'sinh', 'sqrt', 'tan', 'tanh', 'trunc'
]);

function md(filename, removeMainHeader) {
    let content = fs.readFileSync(path.join(__dirname, filename) + '.md', 'utf8');

    if (removeMainHeader) {
        content = content.replace(/^# [^\r\n]+/m, '');
    }

    return content;
}

function ident(text, prefix = '  ') {
    return prefix + text.split(/\r\n?|\n/).join(`\n${prefix}`);
}

function processMarkdown(article, href, { examples, methods }) {
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
                        const methodRefs = Object.create(null);
                        const ast = jora.syntax.parse(token.text).ast;
                        const parsedExample = parseExample(token.text);

                        if ('result' in parsedExample && !parsedExample.hasErrors && !parsedExample.inputRef) {
                            let actual;

                            try {
                                actual = jora(parsedExample.content)(parsedExample.input, parsedExample.context);
                            } catch (e) {
                                console.log('[ERROR] Jora query example parse error:');
                                console.log(e.message);
                            }

                            try {
                                assert.deepEqual(parsedExample.result, actual);
                            } catch {
                                console.log('[WARN] The result in example doesn\'t match to actual result:');
                                console.log(ident(parsedExample.content));
                                console.log('Example result:');
                                console.log(' ', parsedExample.result);
                                console.log('Actual:');
                                console.log(' ', actual);
                                console.log();
                            }
                        }

                        jora.syntax.walk(ast, function(node) {
                            if (node.type === 'Method' && node.reference.type === 'Identifier') {
                                const methodName = node.reference.name;

                                if (methodName in methodRefs === false) {
                                    methodRefs[methodName] = [];
                                }

                                methodRefs[methodName].push({
                                    method: node.reference.name,
                                    nameRange: node.reference.range,
                                    range: node.range
                                });
                            }
                        });

                        for (const methodName of Object.keys(methodRefs)) {
                            const method = methods.find(method => method.name === methodName);

                            if (!method) {
                                console.log(`Unknown method "${methodName}" found in article "${article.slug}":\n${token.text}\n`);
                                continue;
                            }

                            method.examples.push(examples.length);
                        }

                        examples.push({
                            article,
                            header: lastHeader.replace(/<!--.+?-->/g, ''),
                            methodRefs,
                            source: token.text,
                            ast
                        });
                    } catch (e) {
                        // console.log();
                        // console.log('[ERROR] Example parse error:', e.message);
                        // console.log('Article:', href);
                        // console.log('Example:');
                        // console.log(ident(token.text));
                    }
                }

                break;
            }
        }
    }
}

function processChangelog(changelog, methods) {
    const changelogSections = changelog.split(/^#+\s*(.+)$/gm).slice(1);
    const changelogMethodRefs = Object.create(null);

    for (let i = 0; i < changelogSections.length; i += 2) {
        const [header, content] = changelogSections.slice(i, i + 2);
        const [, version, date] = header.match(/(\S+)\s+\((.+)\)/) || [, header];

        for (const token of marked.lexer(content || '')) {
            if (token.type === 'list') {
                for (let item of token.items) {
                    const [typeOfChange] = item.text.match(/^\S+/);
                    const prelude = item.text.split(/;|\b\.\B/)[0].replace(/\((?:`[^`]+`|[^)])*\)\s*/g, m => m.trim().length === 2 ? '()' : '');
                    const methodRefs =
                        prelude.match(/`[a-z\d]+\([^\)]*?\)`(?=(?:\s*(?:and|,)\s*`[a-z\d]+\([^\)]*?\)`)*\s*method)/ig) ||
                        prelude.match(/(?<=methods?\s*(?::\s*)?(?:`[a-z\d]+\([^\)]*?\)`\s*(?:and|,)\s*)*)`[a-z\d]+\([^\)]*?\)`/ig);

                    if (methodRefs) {
                        for (const methodRef of methodRefs) {
                            const methodName = methodRef.slice(1).match(/^[^\(]+/);

                            if (!Array.isArray(changelogMethodRefs[methodName])) {
                                changelogMethodRefs[methodName] = [];
                            }

                            changelogMethodRefs[methodName].unshift({
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

    for (const method of methods) {
        method.changelog = changelogMethodRefs[method.name] || [];
    }
}

module.exports = function() {
    const examples = [];
    const methods = Object.keys(jora.methods).sort().map(name => ({
        name,
        namespace: mathMethods.has(name) ? 'math' : undefined,
        examples: []
    }));
    const changelog = { slug: 'changelog', title: 'Changelog', headers: true, content: md('../../CHANGELOG') };
    const articles = [
        { slug: 'getting-started', title: 'Getting started', expanded: true, headers: true },
        { slug: 'api', title: 'Jora library API', headers: true, content: md('../articles/api', true) },
        changelog
    ];
    const readmeTOC = md('../README').match(/- \[.+?\]\(.+?\).*?\n/g)
        .map(point => {
            const [, title, href] = point.match(/\[(.+?)\]\((.+)\.md\)/);
            const slug = href.replace(/\.(\/articles)?\/|\.md$/g, '');
            const content = md(`.${href}`)
                .replace(/^#.+?\n+/, '')
                .replace(/\(#(.+?)\)/g, `(#article:jora-syntax-${slug}&!anchor=$1)`)
                .replace(/\(\.\/(api)\.md#([a-z0-9\-]+)\)/g, '(#article:$1&!anchor=$2)')
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

            processMarkdown(article, href, { examples, methods });

            return article;
        });

    for (let article of articles) {
        if ('content' in article === false) {
            article.content = md(`text/${article.slug}`);
        }

        if (article.headers) {
            article.headers = [];
        }

        processMarkdown(article, article.href || article.slug, { examples, methods });
    }

    processChangelog(changelog.content, methods);

    articles.unshift(readmeTOC.shift());
    articles[0].slug = 'intro';
    articles.splice(3, 0, {
        ...readmeTOC.shift(),
        slug: 'jora-syntax',
        title: 'Jora query syntax',
        expanded: true,
        children: readmeTOC
    });

    for (const example of examples) {
        example.article = example.article.slug;
    }

    return {
        version: require('../../package.json').version,
        intro: md('./text/intro'),
        articles,
        examples,
        methods
    };
};
