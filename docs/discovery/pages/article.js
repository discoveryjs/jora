/* global discovery */
discovery.page.define('article', {
    view: 'context',
    data: 'articles  | $ + ..($parent:$; children.({ ..., $parent })) | $[=>slug=#.id]',
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
            codeActionButtons: {
                view: 'button',
                when: 'syntax = "jora"',
                content: 'text:"Open in playground"',
                data: '{ href: { query: content }.playgroundLink() }'
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
