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
                            'button:{ text: "Get started", href: "#article:get-started" }',
                            'button-primary:{ text: "Jora query syntax", href: "#article:jora-syntax" }'
                        ]
                    },
                    'html:"<br>"',
                    {
                        view: 'md',
                        source: [
                            'Jora is a powerful and expressive query language designed for querying and transforming JavaScript-like or JSON data.',
                            'It\'s a superset of [JSON5](https://json5.org/) and shares many similarities with JavaScript.',
                            '',
                            'Major features:',
                            '',
                            '- Compact syntax for common tasks',
                            '- Aggregate values across arrays and eliminate duplicates by default',
                            '- Extensible by custom methods',
                            '- No input data mutation or side effects<sup>\*</sup>',
                            '- Input data never causes to an exception<sup>\*</sup>, i.e. returns *nothing* (`undefined`) for paths that not reachable or not applicable for an operator or a method',
                            '- Superset of [JSON5](https://json5.org/)',
                            '- Stat collecting mode (powers suggestions)',
                            '- Tolerant parsing mode (useful to provide query suggestions in an editor)',
                            '',
                            '> <sup>*</sup> Extension methods may cause input data mutations, have side effects and throw an exception. However, that\'s an anti-pattern and outside of Jora\'s scope.',
                            '',
                            'Related projects:',
                            '',
                            '- [Discovery](https://github.com/discoveryjs/discovery) – Uses jora as core fuctionality to transform a data flow for views and query data for reports',
                            '- [JsonDiscovery](https://github.com/discoveryjs/browser-extension-json-discovery) – a browser’s extension based on Discovery for viewing JSON documents, available for [Chrome](https://chrome.google.com/webstore/detail/jsondiscovery/pamhglogfolfbmlpnenhpeholpnlcclo) and [Firefox](https://addons.mozilla.org/en-GB/firefox/addon/jsondiscovery/) (read more [Changing a way we’re viewing JSON in a browser](https://medium.com/@rdvornov/changing-a-way-were-viewing-json-in-a-browser-51eda9103fa2))',
                            '- [jora-cli](https://github.com/discoveryjs/jora-cli) – Command line interface for transforming data using Jora',
                            '- [Jora sandbox](https://discoveryjs.github.io/jora-sandbox/) – A Web interface where you can play with jora syntax or transform some JSON with zero setup'
                        ]
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
