/* global discovery */
discovery.page.define('article', {
    view: 'context',
    data: 'articles | $ + ..($parent:$; children.({ ..., $parent })) | $[=>slug=#.id]',
    content: [
        {
            view: 'page-header',
            content: {
                view: 'h1',
                data: '$ + ..parent | reverse().title',
                content: {
                    view: 'inline-list',
                    className: 'article-path'
                }
            }
        },
        {
            view: 'markdown',
            data: 'content',
            codeConfig: 'example',
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
            }
        },
        {
            view: 'block',
            className: 'prev-next-nav',
            content: [
                {
                    view: 'button',
                    when: 'prev',
                    data: '{ text: "← Previous: " + prev.title, href: prev.slug.pageLink("article") }'
                },
                {
                    view: 'button',
                    when: 'next',
                    data: '{ text: "Next: " + next.title + " →", href: next.slug.pageLink("article") }'
                }
            ]
        }
    ]
});