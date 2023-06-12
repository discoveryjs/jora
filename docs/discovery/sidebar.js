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
        view: 'tree',
        limitLines: false,
        data: 'articles.({ ..., text: title, href: slug.pageLink("article") })',
        item: 'link',
        itemConfig: {
            limit: false,
            expanded: '=expanded',
            children: `
                children
                    ? children.({ ..., text: title, href: slug.pageLink("article") })
                    : headers.[level=2].({ text: title, href: @.slug.pageLink("article", { "!anchor": title.slug() }) })
            `
        }
    }
]);
