/* global discovery */
/* eslint-env browser */

const toc = {
    view: 'content-filter',
    className: 'toc-filter',
    content: [
        {
            view: 'list',
            data: `
                #.data.methods
                    .[name ~= #.filter]
                    .group(=>namespace or "")
                    .({
                        namespace: key,
                        methodGroups: value.sort(name ascN)
                            .group(=> name[0])
                            .({ litera: key, methods: value })
                    })
                    .sort(namespace ascN)
            `,
            item: [
                {
                    view: 'block',
                    when: 'namespace',
                    className: 'toc-section-header',
                    content: 'text:namespace'
                },
                {
                    view: 'inline-list',
                    data: 'methodGroups',
                    limit: false,
                    itemConfig: {
                        className: 'toc-group-item',
                        content: {
                            view: 'inline-list',
                            className: 'toc-group',
                            data: 'methods',
                            limit: false,
                            postRender(el, _, methods) { el.dataset.litera = methods[0].name[0]; },
                            item: {
                                view: 'link',
                                data: '{ href: "#!" + name.toLowerCase(), text: name, match: #.filter }',
                                content: 'text-match'
                            }
                        }
                    }
                }
            ]
        }
    ]
};

discovery.page.define('article', {
    view: 'context',
    data: 'articles | $ + ..($parent:$; children.({ ..., $parent })) | $[=>slug=#.id]',
    content: [
        {
            view: 'page-header',
            data: '$ + ..parent | reverse().title',
            prelude: {
                view: 'inline-list',
                className: 'article-path',
                data: '$[:-1]',
                whenData: true
            },
            content: [
                'h1:$[-1]',
                {
                    view: 'block',
                    when: '#.id = "jora-syntax-methods-builtin"',
                    className: 'scroll-to-top',
                    content: {
                        view: 'button',
                        className: 'scroll-to-top-button',
                        content: 'text:"Scroll to top"',
                        onClick(el) {
                            el.closest('.discovery-content').scrollTop = 0;
                            discovery.setPageAnchor();
                        }
                    }
                }
            ]
        },

        {
            view: 'context',
            when: '#.id = "jora-syntax-methods-builtin"',
            content: toc
        },

        {
            view: 'markdown',
            data: 'content',
            codeConfig: 'example',
            postRender(el, _, __, context) {
                if (context.id === 'jora-syntax-methods-builtin') {
                    [...el.querySelectorAll('.view-h2')].forEach(h2 => {
                        const comment = h2.childNodes[2];
                        if (comment?.nodeType === 8) {
                            h2.replaceChild(document.createTextNode(comment.nodeValue), comment);
                        }
                    });
                }
            },
            sectionPrelude: {
                view: 'block',
                className: 'changelog',
                when: '#.id = "jora-syntax-methods-builtin" and #.section.text ~= /^[a-z\\d]+\\(/i',
                data: `
                    $method: #.section.text.match(/^[a-z0-9]+/i).matched[];
                    #.data.methods[=> name = $method].changelog
                `,
                whenData: true,
                content: [
                    `text:pick(=>type = "Added") |
                        $ ? "History: " + (version = "next" ? "Will be available in next release" : \`Added in \${version} (\${date})\`)
                        : "History:"`
                ]
            },
            sectionPostlude: {
                view: 'block',
                className: 'across-docs-examples',
                when: '#.id = "jora-syntax-methods-builtin" and #.section.text ~= /^[a-z\\d]+\\(/i',
                data: `
                    $method: #.section.text.match(/^[a-z0-9]+/i).matched[];
                    #.data.methods[=> name = $method].examples
                        .[article.slug != #.id or header != #.section.text]
                        .({ ..., $method })
                `,
                whenData: true,
                content: {
                    view: 'expand',
                    header: 'text:`${size()} more example${size() > 1 ? "s" : ""} across documentation`',
                    content: {
                        view: 'ul',
                        data: 'group(=>article.slug + "/" + header)',
                        item: [
                            {
                                view: 'block',
                                className: 'path-to-example',
                                data: 'value[]',
                                content: [
                                    'inline-list:article | $ + ..parent | reverse().(title + " /\\xa0").join("")',
                                    'link:{ text: header, href: `#article:${article.slug}&!anchor=${header.slug()}` }'
                                ]
                            },
                            {
                                view: 'list',
                                className: 'examples-list',
                                data: 'value',
                                item: 'example:{ $method; syntax: "jora", source, refs: methodRefs[$method].({ range: nameRange }) }'
                            }
                        ]
                    }
                }
            }
        },
        {
            view: 'block',
            className: 'prev-next-nav',
            content: [
                {
                    view: 'button',
                    className: 'prev-button',
                    when: 'prev',
                    href: '=prev.slug.pageLink("article")',
                    content: 'text:"Previous: " + prev.title'
                },
                {
                    view: 'button',
                    className: 'next-button',
                    when: 'next',
                    href: '=next.slug.pageLink("article")',
                    content: 'text:"Next: " + next.title'
                }
            ]
        }
    ]
});
