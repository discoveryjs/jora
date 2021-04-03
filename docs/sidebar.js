/* global discovery */
discovery.view.define('sidebar', [
    {
        view: 'ul',
        data: 'articles',
        item: 'link:{ text: title, href: slug.pageLink("article") }'
    }
]);
