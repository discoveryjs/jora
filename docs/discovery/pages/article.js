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
        'md:content'
    ]
});
