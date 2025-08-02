/* eslint-env browser */
/* global discovery */

discovery.dom.ready.then(() => {
    const sidebarTriggerEl = document.createElement('button');
    sidebarTriggerEl.className = 'discovery-sidebar-trigger';
    sidebarTriggerEl.tabIndex = 0;
    sidebarTriggerEl.addEventListener('click', () => sidebarTriggerEl.classList.toggle('opened'), true);
    discovery.dom.container.prepend(sidebarTriggerEl);
    discovery.dom.container.addEventListener('click', (e) => {
        if (!discovery.dom.sidebar.contains(e.target) && !sidebarTriggerEl.contains(e.target)) {
            sidebarTriggerEl.classList.remove('opened');
        }
    }, true);
    discovery.on('pageHashChange', () => sidebarTriggerEl.classList.remove('opened'));
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
        item: ['link', { view: 'pill-badge', when: 'slug="jora-syntax-methods-builtin"', text: '=#.data.methods.size()' }],
        itemConfig: {
            limit: false,
            expanded: '=expanded',
            children: `
                children
                    ? children.({ ..., text: title, href: slug.pageLink("article") })
                    : headers.[level=2].({ text: title, href: @.slug.pageLink("article", null, title.slug()) })
            `
        }
    }
]);
