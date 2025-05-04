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
                            'button{ text: "Getting started", href: "#article:getting-started" }',
                            'button{ text: "Jora query syntax", href: "#article:jora-syntax" }',
                            'button-primary{ text: "Playground", href: "#playground" }'
                        ]
                    },
                    'html:"<br>"',
                    {
                        view: 'md',
                        source: '=intro'
                    }
                ]
            }
        ]
    }
]);
