/* global discovery */

Promise.resolve().then(() =>
    discovery.nav.before('inspect', {
        name: 'github',
        data: '{ text: "GitHub", href: "https://github.com/discoveryjs/jora" }'
    })
);

discovery.page.define('default', [
    {
        view: 'page-header',
        content: [
            'h1:"Jora"',
            'badge:version',
            'text:"JavaScript object query engine"'
        ]
    },
    'md:articles[=>slug="intro"].content'
]);
