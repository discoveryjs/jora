/* global discovery */
discovery.view.define('sidebar', [
    {
        view: 'h2',
        content: [
            'text:"Jora"',
            {
                view: 'block',
                className: 'version',
                content: 'text:version'
            }
        ]
    },
    {
        view: 'ul',
        data: 'articles',
        item: [
            'link:{ text: title, href: slug.pageLink("article") }',
            {
                view: 'ul',
                data: 'headers.[level=2].({ text, href: @.slug.pageLink("article", { "!anchor": text.slug() }) })',
                whenData: true,
                item: 'link'
            }
        ]
    }
]);
