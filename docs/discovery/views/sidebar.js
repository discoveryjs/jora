/* eslint-env browser */
/* global discovery */

discovery.dom.ready.then(() => {
    const sidebarTriggerEl = document.createElement('label');
    const sidebarTriggerStateEl = document.createElement('input');
    sidebarTriggerStateEl.type = 'checkbox';
    sidebarTriggerEl.className = 'discovery-sidebar-trigger';
    sidebarTriggerEl.append(sidebarTriggerStateEl);
    sidebarTriggerEl.tabIndex = 0;
    discovery.dom.container.prepend(sidebarTriggerEl);
    discovery.on('pageHashChange', () => sidebarTriggerStateEl.checked = false);
});

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
