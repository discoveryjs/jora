/* global discovery */

discovery.view.define('example', {
    view: 'source',
    data: '{ ..., ...source.parseExample() }',
    actionButtons: {
        view: 'button',
        when: 'syntax = "jora"',
        content: 'text:"Open in playground"',
        data: '{ href: { query: content }.playgroundLink() }'
    },
    // prelude: {
    //     view: 'struct',
    //     when: 'syntax = "jora"'
    // },
    postlude: {
        view: 'struct',
        className: 'view-struct_code-postlude',
        when: 'syntax = "jora" and $ has "result"',
        data: 'result',
        limitCollapsed: false,
        limitCompactObjectEntries: 10
    }
}, { tag: false });
