/* global discovery */

discovery.page.define('default', [
    {
        view: 'page-header',
        content: [
            'h1:"Jora"',
            'badge:version',
            'text:"JavaScript object query engine"'
        ]
    },
    {
        view: 'block',
        className: 'main-layout',
        content: [
            {
                view: 'block',
                className: 'column',
                content: [
                    {
                        view: 'md',
                        source: [
                            '```\nnpm install jora\n```'
                        ]
                    },
                    'html:"<br>"',
                    {
                        view: 'block',
                        content: [
                            'button:{ text: "Get started", href: "#article:getting-started" }',
                            'button-primary:{ text: "Jora query syntax", href: "#article:jora-syntax" }'
                        ]
                    },
                    'html:"<br>"',
                    {
                        view: 'md',
                        source: '=intro'
                    }
                ]
            },
            {
                view: 'block',
                className: 'column',
                content: [
                    'button:{ text: "GitHub", href: "https://github.com/discoveryjs/jora" }',
                    'button:{ text: "Jora playground", href: "#playground" }'
                ]
            }
        ]
    }
]);
