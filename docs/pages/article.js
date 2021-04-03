/* global discovery */
discovery.page.define('article', {
    view: 'context',
    data: 'articles[=>slug=#.id]',
    content: [
        {
            view: 'page-header',
            content: 'h1:title'
        },
        'md:content',
        'struct'
    ]
});
